import requests
import os
import time
from dotenv import load_dotenv
from langchain_community.llms import Ollama
# from pydantic import BaseModel

# load environment variables from dev.env file
load_dotenv(dotenv_path="dev.env")

appid = os.getenv("APPID")
openweathermap_base_url = 'https://api.openweathermap.org'

if not appid or not isinstance(appid, str):
    raise ValueError("APPID environment variable is not set or is not a string.")

# class Coordinates(BaseModel):
#     latitude: float
#     longitude: float
    
# class CityInfo(BaseModel):
#     city_name_sv: str
#     coordinates: tuple

# functions
def get_coordinates_from_city(city_name: str) -> tuple:
    """
    Retrieves the coordinates (latitude and longitude) of a given city.

    Args:
        city_name (str): The name of the city.

    Returns:
        tuple: A tuple containing the latitude and longitude of the city.
    """
    base_url = f'{openweathermap_base_url}/geo/1.0/direct'
    query_params = {
        "q": city_name,
        "limit": "1",
        "appid": appid
    }
    response = requests.get(base_url, params=query_params)

    if response.status_code == 200:
        data = response.json()
        #city_name_sv = data[0].get("local_names")["sv"]
        latitude = float(data[0].get("lat"))
        longitude = float(data[0].get("lon"))
        
        return (latitude, longitude)
        #return CityInfo(city_name_sv=city_name_sv, coordinates=(lat, lon))
        #return CityInfo(city_name_sv=city_name_sv, coordinates=Coordinates(latitude=lat, longitude=lon))
    else:
        print("API request failed with status code:", response.status_code)
        return None

def get_weather(coordinates: tuple, city_name: str):
    """
    Get the weather information for a given set of coordinates and city name.

    Args:
        coordinates (tuple): A tuple containing the latitude and longitude of the location.
        city_name (str): The name of the city.

    Returns:
        None
    """
    latitude, longitude = coordinates
    base_url = f'{openweathermap_base_url}/data/2.5/weather'
    query_params = {
        "lat": latitude,
        "lon": longitude,
        "appid": appid,
        "units": "metric",
        "lang": "se"
    }
    response = requests.get(base_url, params=query_params)

    if response.status_code == 200:
        data = response.json()
        description = data.get("weather")[0].get("description")
        temp = data.get("main").get("temp")
        print(f'Vädret i {city_name} är nu {temp}°C och {description}.')
    else:
        print("API request failed with status code:", response.status_code)

def get_general_question(question: str) -> str:
    """
    Retrieves the response from the Ollama API for a general question.

    Args:
        question (str): The question to be asked.

    Returns:
        str: The response from the Ollama API.
    """
    # Just as an example, we use the llama2 model here.
    ollama_llama2 = Ollama(base_url='http://localhost:11434', model='llama2')
    print(ollama_llama2.invoke(question))


QUESTION = input("QUESTION: ")

start_time = time.time()

RAVEN_PROMPT = \
'''
Function:
def get_coordinates_from_city(city_name: str) -> tuple:
    """
    Retrieves the coordinates (latitude and longitude) of a given city.

    Args:
        city_name (str): The name of the city.

    Returns:
        tuple: A tuple containing the latitude and longitude of the city.
    """

Function:
def get_weather(coordinates: tuple, city_name: str):
    """
    Get the weather information for a given set of coordinates and city name.

    Args:
        coordinates (tuple): A tuple containing the latitude and longitude of the location.
        city_name (str): The name of the city.

    Returns:
        None
    """

Function:
def get_general_question(question: str) -> str:
    """
    Retrieves the response from the Ollama API for a general question.

    Args:
        question (str): The question to be asked.

    Returns:
        str: The response from the Ollama API.
    """

Notes:
If it is not a query related to weather, just use the get_general_question function.

User Query: {query}
'''

my_question = RAVEN_PROMPT.format(query = QUESTION)

# url: https://api.python.langchain.com/en/latest/llms/langchain_community.llms.ollama.Ollama.html
ollama = Ollama(base_url='http://localhost:11434', model='nexusraven:latest')
answer = ollama.invoke(my_question, temperature=0.001, stop=["Thought:"], num_predict=2000)

#print(answer)

raven_call = answer.replace("Call:", "").strip()
#print(raven_call)


# execute function call
exec(raven_call)


end_time = time.time()
execution_time = end_time - start_time
print(f"Execution time: {int(execution_time)} seconds")
