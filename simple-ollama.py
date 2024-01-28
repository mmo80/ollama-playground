from langchain_community.llms import Ollama

ollama = Ollama(base_url='http://localhost:11434', model='llama2')

print(ollama('Why is the sky blue?'))