# Using Langchain with Ollama and Python
# url: https://youtu.be/CPgp8MhmGVY?si=J9dQ2lUZXp5hov__

from langchain_community.llms import Ollama
from langchain_community.document_loaders import WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA

ollama = Ollama(base_url='http://localhost:11434', model='llama2')

loader = WebBaseLoader('https://en.wikipedia.org/wiki/Ancient_Egypt')
data = loader.load()

text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=0)
all_splits = text_splitter.split_documents(data)

vectorstore = Chroma.from_documents(documents=all_splits, embedding=OllamaEmbeddings(base_url='http://localhost:11434', model='llama2'))

qachain = RetrievalQA.from_chain_type(ollama, retriever=vectorstore.as_retriever())

question = "When did Egypt reach the pinnacle of its power?"

answer = qachain({"query": question})

print(answer)