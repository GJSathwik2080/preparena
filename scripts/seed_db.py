import boto3
import json
import os
import time
from google import genai
from google.genai import types
from uuid import uuid4

# Load environment variable with fallback from frontend/.env if needed
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    env_path = os.path.join(os.path.dirname(__file__), "..", "frontend", ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("VITE_GEMINI_API_KEY="):
                    api_key = line.strip().split("=", 1)[1]
                    break

if not api_key:
    raise ValueError("Please set the GEMINI_API_KEY environment variable or define VITE_GEMINI_API_KEY in frontend/.env.")

client = genai.Client(api_key=api_key)

# Setup DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
table = dynamodb.Table('prep-arena-stack-QuestionsBank-1XZINSUCSZNIZ')

TEST_CONFIGS = [
    {
        "testId": "cognitive-mock-1",
        "topic": "Cognitive Ability: Verbal Ability (Sentence Correction for subject-verb agreement, tenses), Reading Comprehension, Synonyms/Antonyms, and Logical Deductions.",
        "num_questions": 30
    },
    {
        "testId": "cognitive-mock-2",
        "topic": "Cognitive Ability: Critical Reasoning, Statement & Assumptions, Syllogisms, and Direction Sense.",
        "num_questions": 30
    },
    {
        "testId": "cognitive-mock-3",
        "topic": "Cognitive Ability: Abstract Reasoning, Number & Letter Series, Pattern Analysis, and Blood Relations.",
        "num_questions": 30
    },
    {
        "testId": "cognitive-mock-4",
        "topic": "Cognitive Ability: Data Sufficiency, Analytical Puzzles, Analogies, and Seating Arrangement.",
        "num_questions": 30
    },
    {
        "testId": "technical-mock-1",
        "topic": "Technical Ability: Pseudocode execution (bitwise operators `&`, `|`, `^`, nested loops, and recursion trees).",
        "num_questions": 30
    },
    {
        "testId": "technical-mock-2",
        "topic": "Technical Ability: Cloud Computing (AWS core services, IAM, serverless, VPC networking) and Network Protocols (TCP/IP, DNS, HTTPS, Subnetting).",
        "num_questions": 30
    },
    {
        "testId": "technical-mock-3",
        "topic": "Technical Ability: Operating Systems (Process Scheduling, Deadlocks, Virtual Memory Paging, Mutex/Semaphores) and DBMS (SQL queries, indexing, ACID transactions).",
        "num_questions": 30
    },
    {
        "testId": "technical-mock-4",
        "topic": "Technical Ability: MS Office/Excel formulas, Cybersecurity fundamentals (firewalls, encryption, authentication headers), and Web architecture.",
        "num_questions": 30
    },
    {
        "testId": "coding-mock-1",
        "topic": "Coding Ability: Data Structures (Arrays, Strings, Hash Maps, Sliding Window techniques).",
        "num_questions": 20
    },
    {
        "testId": "coding-mock-2",
        "topic": "Coding Ability: Stacks, Queues, Linked Lists, and Two-Pointer Algorithms.",
        "num_questions": 20
    },
    {
        "testId": "coding-mock-3",
        "topic": "Coding Ability: Binary Trees, Binary Search, Heaps/Priority Queues, and Graph Traversal (BFS/DFS).",
        "num_questions": 20
    },
    {
        "testId": "coding-mock-4",
        "topic": "Coding Ability: Dynamic Programming (Memoization, Tabulation), Greedy Algorithms, and Complexity Analysis.",
        "num_questions": 20
    }
]

def generate_batch(config, batch_size):
    prompt = f"""
    Act as a Lead Technical Assessment Architect designing a standard competitive screening exam for final-year engineering graduates.
    Generate {batch_size} moderately challenging, high-quality multiple choice questions.
    
    Difficulty Guidelines:
    - Questions must be clear, concise, and focused on core principles and problem solving.
    - Avoid excessively long essay-length scenarios; keep questions readable within 60 to 90 seconds.
    - Test understanding of applied concepts (e.g., predicting code output, time complexity, network error resolution, query logic).
    
    CRITICAL FORMATTING RULES:
    - Any code snippet, pseudocode, algorithm, or terminal command embedded in `questionText` or `options` MUST be wrapped in standard Markdown code blocks with appropriate language tags (e.g., ```python ... ```, ```cpp ... ```, ```sql ... ```, or `inline code`).
    - Every question MUST have exactly 4 options.
    - `correctAnswer` must match one of the 4 options verbatim.
    - `explanation` must be a crisp 2-4 sentence explanation of why the correct answer is right and why alternatives are wrong.
    
    Topic focus: {config['topic']}
    
    Output strictly a valid JSON array of objects with the following keys:
    - "testId": Always "{config['testId']}"
    - "category": Short descriptive category name (e.g., "Pseudocode: Bitwise", "Cloud: VPC", "DSA: Arrays")
    - "questionText": The formatted question text with markdown code blocks where applicable
    - "options": An array of exactly 4 strings
    - "correctAnswer": The correct string matching one option exactly
    - "explanation": Crisp explanation of the correct logic
    """
    
    for attempt in range(5):
        try:
            response = client.models.generate_content(
                model='gemini-3.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.7
                )
            )
            
            text = response.text.strip()
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
            print(f"\n--- Generating {config['num_questions']} questions for {config['testId']} ---")
            remaining = config['num_questions']
            
            while remaining > 0:
                current_size = min(batch_request_size, remaining)
                print(f"Requesting batch of {current_size} questions...")
                
                questions = generate_batch(config, current_size)
                
                if questions:
                    for q in questions:
                        # Ensure globally unique question ID
                        q['questionId'] = str(uuid4())
                        batch.put_item(Item=q)
                    
                    inserted_count = len(questions)
                    total_questions += inserted_count
                    remaining -= inserted_count
                    print(f"  -> Successfully injected {inserted_count} questions into DynamoDB. ({remaining} left)")
                else:
                    print(f"  -> Skipping remaining questions for {config['testId']} due to persistent errors.")
                    break
                
                time.sleep(3)
                
    print(f"\nDATABASE SEEDING COMPLETE! Total questions injected this run: {total_questions}")

if __name__ == "__main__":
    seed_db()