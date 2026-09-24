import boto3
import json
import os
import time
from google import genai
from google.genai import types
from uuid import uuid4

# Setup Gemini Client
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("Please set the GEMINI_API_KEY environment variable.")
client = genai.Client(api_key=api_key)

# Setup DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
table = dynamodb.Table('QuestionsBank')

TEST_CONFIGS = [
    {
        "testId": "cognitive-mock-1",
        "topic": "Cognitive Ability: English Verbal Ability (Reading Comprehension, Sentence Correction for subject-verb agreement and tenses, Synonyms/Antonyms), Logical Reasoning, Critical Reasoning, and Abstract Reasoning.",
        "num_questions": 30
    },
    {
        "testId": "cognitive-mock-2",
        "topic": "Cognitive Ability: English Verbal Ability (Reading Comprehension, Sentence Correction for subject-verb agreement and tenses, Synonyms/Antonyms), Logical Reasoning, Critical Reasoning, and Abstract Reasoning.",
        "num_questions": 30
    },
    {
        "testId": "technical-mock-1",
        "topic": "Technical Ability: MS Office (Word formatting/shortcuts, Excel cell referencing like $A$1/basic formulas, PowerPoint basics), Pseudocode (bitwise operators, nested loops, recursion), and Networking, Security & Cloud (OSI model layers, TCP/IP, basic IP addressing, IaaS/PaaS/SaaS, SQL injection, DDoS).",
        "num_questions": 30
    },
    {
        "testId": "technical-mock-2",
        "topic": "Technical Ability: MS Office (Word formatting/shortcuts, Excel cell referencing like $A$1/basic formulas, PowerPoint basics), Pseudocode (bitwise operators, nested loops, recursion), and Networking, Security & Cloud (OSI model layers, TCP/IP, basic IP addressing, IaaS/PaaS/SaaS, SQL injection, DDoS).",
        "num_questions": 30
    },
    {
        "testId": "coding-mock-1",
        "topic": "Coding Ability: Data Structures and Algorithms (presented as advanced code-snippet MCQs).",
        "num_questions": 20
    },
    {
        "testId": "coding-mock-2",
        "topic": "Coding Ability: Data Structures and Algorithms (presented as advanced code-snippet MCQs).",
        "num_questions": 20
    }
]

def generate_questions_for_test(config):
    print(f"Generating {config['num_questions']} questions for {config['testId']}...")
    prompt = f"""
    Act as an elite technical assessor designing a campus placement exam for final-year Computer Science engineering students.
    Generate {config['num_questions']} mock test questions strictly mirroring Accenture's Previous Year Question (PYQ) difficulty and exact syllabus.
    
    Topic focus: {config['topic']}
    
    Every question MUST be 100% accurate, have a definitively correct answer, and include a detailed, logically sound `explanation` field that teaches the concept. No hallucinations.
    
    You must output STRICTLY a JSON array of objects.
    Each object must have the following keys:
    - testId: Always "{config['testId']}"
    - questionId: A unique string identifier for the question
    - category: The topic category (e.g., "Verbal", "Pseudocode", "MS Office", "Cloud", "DSA")
    - questionText: The text of the question
    - options: An array of exactly 4 strings representing the possible answers
    - correctAnswer: The correct string exactly matching one of the options
    - explanation: A detailed, logically sound explanation of why the answer is correct
    """
    
    # Use gemini-3.5-flash-lite to prevent timeouts for large generation
    response = client.models.generate_content(
        model='gemini-3.5-flash-lite',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.7
        )
    )
    
    text = response.text
    if text.startswith("```json"):
        text = text[7:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())

def seed_db():
    total_questions = 0
    with table.batch_writer() as batch:
        for config in TEST_CONFIGS:
            try:
                questions = generate_questions_for_test(config)
                for q in questions:
                    if not q.get('questionId'):
                        q['questionId'] = str(uuid4())
                    batch.put_item(Item=q)
                total_questions += len(questions)
                print(f"Successfully seeded {len(questions)} questions for {config['testId']}.")
                time.sleep(2) # Prevent rate limiting
            except Exception as e:
                print(f"Error generating questions for {config['testId']}: {e}")
                
    print(f"Database seeding complete! Total questions inserted: {total_questions}")

if __name__ == "__main__":
    seed_db()
