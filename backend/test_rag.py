from app.ai.tools.rag_career_tool import RAGCareerTool

tool = RAGCareerTool()
results = tool._run(query="What student outcomes are demonstrated in Software Design?")
print(results)
