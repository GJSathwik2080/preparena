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
table = dynamodb.Table('prep-arena-stack-QuestionsBank-1XZINSUCSZNIZ')

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
        "testId": "cognitive-mock-3",
        "topic": "Cognitive Ability: English Verbal Ability (Reading Comprehension, Sentence Correction for subject-verb agreement and tenses, Synonyms/Antonyms), Logical Reasoning, Critical Reasoning, and Abstract Reasoning.",
        "num_questions": 30
    },
    {
        "testId": "cognitive-mock-4",
        "topic": "Cognitive Ability: English Verbal Ability (Reading Comprehension, Sentence Correction for subject-verb agreement and tenses, Synonyms/Antonyms), Logical Reasoning, Critical Reasoning, and Abstract Reasoning.",
        "num_questions": 30
    },
    {
        "testId": "technical-mock-1",
        "topic": "Technical Ability: MS Office, Pseudocode (bitwise operators, nested loops, recursion), and Networking, Security & Cloud.",
        "num_questions": 30
    },
    {
        "testId": "technical-mock-2",
        "topic": "Technical Ability: MS Office, Pseudocode (bitwise operators, nested loops, recursion), and Networking, Security & Cloud.",
        "num_questions": 30
    },
    {
        "testId": "technical-mock-3",
        "topic": "Technical Ability: MS Office, Pseudocode (bitwise operators, nested loops, recursion), and Networking, Security & Cloud.",
        "num_questions": 30
    },
    {
        "testId": "technical-mock-4",
        "topic": "Technical Ability: MS Office, Pseudocode (bitwise operators, nested loops, recursion), and Networking, Security & Cloud.",
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
    },
    {
        "testId": "coding-mock-3",
        "topic": "Coding Ability: Data Structures and Algorithms (presented as advanced code-snippet MCQs).",
        "num_questions": 20
    },
    {
        "testId": "coding-mock-4",
        "topic": "Coding Ability: Data Structures and Algorithms (presented as advanced code-snippet MCQs).",
        "num_questions": 20
    }
]

def generate_batch(config, batch_size):
    prompt = f"""
    Act as a Principal Engineer designing a technical screening exam for Computer Science engineering students.
    Generate {batch_size} complex, scenario-based architecture, debugging, and system design problems.
    ABSOLUTELY FORBID basic/direct trivia. Do not ask simple definitions. 
    Instead, ask applied questions (e.g., "A distributed database is experiencing circular wait during transactions. Given the following logs, which service is failing?").
    
    Topic focus: {config['topic']}
    
    Every question MUST be 100% accurate, have a definitively correct answer, and include a deeply analytical `explanation` field that explores the tradeoffs, edge cases, and architectural reasoning behind the answer. No hallucinations.
    
    You must output STRICTLY a JSON array of objects.
    Each object must have the following keys:
    - testId: Always "{config['testId']}"
    - category: The topic category
    - questionText: The text of the question
    - options: An array of exactly 4 strings representing the possible answers
    - correctAnswer: The correct string exactly matching one of the options
    - explanation: A detailed, logically sound explanation of why the answer is correct
    """
    
    for attempt in range(5):
        try:
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
            
        except Exception as e:
            print(f"    API Error (Attempt {attempt + 1}/5): {e}")
            if attempt < 4:
                print("    Waiting 15 seconds before retrying...")
                time.sleep(15)
            else:
                print("    Max retries reached for this batch.")
    return []

def seed_db():
    total_questions = 0
    batch_request_size = 5
    
    with table.batch_writer() as batch:
        for config in TEST_CONFIGS:
            print(f"\n--- Generating {config['num_questions']} total questions for {config['testId']} ---")
            remaining = config['num_questions']
            
            while remaining > 0:
                current_size = min(batch_request_size, remaining)
                print(f"Requesting batch of {current_size} questions...")
                
                questions = generate_batch(config, current_size)
                
                if questions:
                    for q in questions:
                        # FORCE a unique ID for every single question to prevent DynamoDB collisions
                        q['questionId'] = str(uuid4())
                        batch.put_item(Item=q)
                    
                    inserted_count = len(questions)
                    total_questions += inserted_count
                    remaining -= inserted_count
                    print(f"  -> Successfully injected {inserted_count} questions into DynamoDB. ({remaining} left for this test)")
                else:
                    print(f"  -> Skipping remaining questions for {config['testId']} due to persistent errors.")
                    break
                
                time.sleep(3)
                
    print(f"\nDATABASE SEEDING COMPLETE! Total questions injected this run: {total_questions}")

if __name__ == "__main__":
    seed_db()