import asyncio
import json
import os
import sys
import time
from pathlib import Path
from sqlalchemy import text

# Add backend directory to path so we can import app modules
sys.path.append(str(Path(__file__).parent.parent))

from app.core.database import async_session_factory
from app.ai.embeddings import embed_text as real_embed_text

# Synchronous wrapper with retry for rate limits
def embed_text_sync(text: str) -> list[float]:
    for attempt in range(5):
        try:
            return real_embed_text(text, task_type="RETRIEVAL_QUERY")
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                wait = 2 ** attempt * 5
                print(f"    Rate limited — waiting {wait}s...")
                time.sleep(wait)
            else:
                raise
    raise Exception("Max retries exceeded for embedding")

async def embed_query(query: str) -> list[float]:
    return await asyncio.to_thread(embed_text_sync, query)

async def evaluate():
    test_set_path = Path(__file__).parent / "rag_test_set.json"
    if not test_set_path.exists():
        print(f"Error: Test set file not found at {test_set_path}")
        return

    with open(test_set_path) as f:
        test_cases = json.load(f)

    print("=" * 60)
    print(f"RAG Evaluation Suite: Running {len(test_cases)} test queries")
    print("=" * 60)

    results = []
    
    # Cosine distance operator <=> (lower is better, similarity = 1 - distance)
    query_sql = text("""
        SELECT title, category,
               1 - (embedding <=> CAST(:vec AS vector)) AS similarity
        FROM knowledge_chunks
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> CAST(:vec AS vector)
        LIMIT :k
    """)

    async with async_session_factory() as session:
        for idx, case in enumerate(test_cases):
            query_str = case["query"]
            expected_title = case["expected_title"].strip().lower()
            expected_cat = case["category"]
            
            print(f"\n[{idx+1}/{len(test_cases)}] Query: \"{query_str}\"")
            print(f"    Expected: [{expected_cat}] \"{case['expected_title']}\"")
            
            try:
                # Embed query
                vec = await embed_query(query_str)
                
                # Search database
                res = await session.execute(query_sql, {"vec": str(vec), "k": 5})
                rows = res.fetchall()
                
                # Analyze rank
                rank = 0
                retrieved_list = []
                for rank_idx, row in enumerate(rows):
                    retrieved_title = row.title.strip().lower()
                    similarity = float(row.similarity)
                    retrieved_list.append((row.title, row.category, similarity))
                    
                    if retrieved_title == expected_title and rank == 0:
                        rank = rank_idx + 1

                if rank > 0:
                    print(f"    ✅ MATCH FOUND at Rank {rank} (Similarity: {retrieved_list[rank-1][2]:.4f})")
                else:
                    print("    ❌ NOT FOUND in top 5")
                    print("    Top retrieved:")
                    for r_idx, (t, c, s) in enumerate(retrieved_list):
                        print(f"      {r_idx+1}. [{c}] \"{t}\" (Sim: {s:.4f})")
                
                results.append({
                    "query": query_str,
                    "expected_title": case["expected_title"],
                    "expected_category": expected_cat,
                    "rank": rank,
                    "retrieved": retrieved_list
                })
                
                # Small delay to respect API limits
                await asyncio.sleep(0.2)
                
            except Exception as e:
                print(f"    Error processing query: {e}")
                results.append({
                    "query": query_str,
                    "expected_title": case["expected_title"],
                    "expected_category": expected_cat,
                    "rank": 0,
                    "error": str(e)
                })

    # Calculate metrics
    total_valid = sum(1 for r in results if "error" not in r)
    hits_at_1 = sum(1 for r in results if r.get("rank") == 1)
    hits_at_3 = sum(1 for r in results if 1 <= r.get("rank", 0) <= 3)
    hits_at_5 = sum(1 for r in results if 1 <= r.get("rank", 0) <= 5)
    
    mrr_sum = sum(1.0 / r["rank"] if r.get("rank", 0) > 0 else 0.0 for r in results)
    
    recall_1 = (hits_at_1 / total_valid) * 100 if total_valid > 0 else 0
    recall_3 = (hits_at_3 / total_valid) * 100 if total_valid > 0 else 0
    recall_5 = (hits_at_5 / total_valid) * 100 if total_valid > 0 else 0
    mrr = mrr_sum / total_valid if total_valid > 0 else 0

    print("\n" + "=" * 60)
    print("EVALUATION RESULTS SUMMARY")
    print("=" * 60)
    print(f"Total Evaluated Queries: {total_valid}")
    print(f"Recall@1: {recall_1:.2f}% ({hits_at_1}/{total_valid})")
    print(f"Recall@3: {recall_3:.2f}% ({hits_at_3}/{total_valid})")
    print(f"Recall@5: {recall_5:.2f}% ({hits_at_5}/{total_valid})")
    print(f"Mean Reciprocal Rank (MRR): {mrr:.4f}")
    print("=" * 60)

    # Save results to markdown for documentation
    output_dir = Path(__file__).parent.parent.parent / "artifacts"
    output_dir.mkdir(exist_ok=True)
    report_path = output_dir / "rag_evaluation_results.md"
    
    with open(report_path, "w") as rf:
        rf.write("# RAG Retrieval Evaluation Report\n\n")
        rf.write(f"**Date/Time:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        rf.write(f"**Total Queries Tested:** {total_valid}\n\n")
        rf.write("## Retrieval Metrics\n\n")
        rf.write("| Metric | Score | Details |\n")
        rf.write("|---|---|---|\n")
        rf.write(f"| **Recall@1** | {recall_1:.2f}% | {hits_at_1}/{total_valid} queries found at rank 1 |\n")
        rf.write(f"| **Recall@3** | {recall_3:.2f}% | {hits_at_3}/{total_valid} queries found in top 3 |\n")
        rf.write(f"| **Recall@5** | {recall_5:.2f}% | {hits_at_5}/{total_valid} queries found in top 5 |\n")
        rf.write(f"| **MRR (Mean Reciprocal Rank)** | **{mrr:.4f}** | Measure of search relevance rank |\n\n")
        
        rf.write("## Query-by-Query Analysis\n\n")
        rf.write("| Query | Expected Chunk | Resolved Rank | Best Similarity |\n")
        rf.write("|---|---|---|---|\n")
        for r in results:
            q = r["query"]
            exp = r["expected_title"]
            rank_str = str(r["rank"]) if r.get("rank", 0) > 0 else "**Not found (top 5)**"
            
            sim_str = "N/A"
            if r.get("rank", 0) > 0:
                # Similarity of correct match
                sim_str = f"{r['retrieved'][r['rank']-1][2]:.4f}"
            elif r.get("retrieved"):
                # Sim of top result
                sim_str = f"{r['retrieved'][0][2]:.4f} (Top result)"
                
            rf.write(f"| \"{q}\" | {exp} | {rank_str} | {sim_str} |\n")

    print(f"Detailed Markdown report saved to: {report_path}")

if __name__ == "__main__":
    asyncio.run(evaluate())
