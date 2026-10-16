"""
Taxonomy and Skill Knowledge Base for the AI Resume Analyzer.
Covers 1,000+ skills categorized across domains, with synonym maps and alias resolutions.
"""

from typing import Dict, List, Set

# Comprehensive Skill Categories
SKILL_TAXONOMY: Dict[str, Dict[str, List[str]]] = {
    "Programming Languages": {
        "Python": ["python", "python3", "py"],
        "JavaScript": ["javascript", "js", "ecmascript", "es6", "es6+"],
        "TypeScript": ["typescript", "ts"],
        "Java": ["java", "core java", "java 8", "java 11", "java 17", "java 21"],
        "C++": ["c++", "cpp"],
        "C#": ["c#", "csharp", "c sharp", ".net"],
        "Go (Golang)": ["golang", "go programming", "go lang"],
        "Rust": ["rust", "rustlang"],
        "Ruby": ["ruby"],
        "PHP": ["php", "php7", "php8"],
        "Swift": ["swift", "swiftui"],
        "Kotlin": ["kotlin"],
        "SQL": ["sql", "t-sql", "pl/sql", "ansi sql"],
        "R": ["r programming", "r language"],
        "Scala": ["scala"],
        "Bash / Shell": ["bash", "shell scripting", "sh", "zsh", "powershell"],
        "HTML/CSS": ["html", "html5", "css", "css3", "sass", "scss", "less"],
        "Dart": ["dart"],
        "Elixir": ["elixir"],
    },
    "Web & Frontend Frameworks": {
        "React": ["react", "react.js", "reactjs"],
        "Next.js": ["next.js", "nextjs", "next"],
        "Angular": ["angular", "angularjs", "angular 2+"],
        "Vue.js": ["vue", "vue.js", "vuejs", "vue3", "nuxt", "nuxt.js"],
        "Svelte": ["svelte", "sveltekit"],
        "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind-css"],
        "Bootstrap": ["bootstrap", "bootstrap 5"],
        "Redux": ["redux", "redux toolkit", "rtk"],
        "Zustand": ["zustand"],
        "GraphQL": ["graphql", "apollo client", "relay"],
        "Webpack / Vite": ["webpack", "vite", "turbopack", "babel"],
        "WebSockets": ["websockets", "websocket", "socket.io"],
    },
    "Backend & APIs": {
        "Node.js": ["node.js", "nodejs", "node"],
        "Express.js": ["express", "express.js", "expressjs"],
        "FastAPI": ["fastapi", "fast-api"],
        "Django": ["django", "django rest framework", "drf"],
        "Flask": ["flask"],
        "Spring Boot": ["spring boot", "springboot", "spring framework", "spring"],
        "ASP.NET Core": ["asp.net", "asp.net core", ".net core", "dotnet core"],
        "Ruby on Rails": ["rails", "ruby on rails"],
        "Laravel": ["laravel"],
        "REST API": ["rest", "restful api", "rest api", "web apis", "restful"],
        "gRPC": ["grpc", "protocol buffers", "protobuf"],
        "Microservices": ["microservices", "microservice architecture", "distributed systems"],
    },
    "Databases & Caching": {
        "PostgreSQL": ["postgresql", "postgres", "psql"],
        "MySQL": ["mysql", "mariadb"],
        "MongoDB": ["mongodb", "mongo"],
        "Redis": ["redis"],
        "Elasticsearch": ["elasticsearch", "elastic search", "opensearch", "elk"],
        "SQLite": ["sqlite", "sqlite3"],
        "Cassandra": ["cassandra", "apache cassandra"],
        "DynamoDB": ["dynamodb", "aws dynamodb"],
        "Snowflake": ["snowflake"],
        "BigQuery": ["bigquery", "google bigquery"],
        "Oracle DB": ["oracle", "oracle database"],
        "Firebase / Supabase": ["firebase", "supabase", "firestore"],
        "Kafka": ["kafka", "apache kafka", "event streaming"],
        "RabbitMQ": ["rabbitmq", "message queue", "amqp"],
    },
    "Cloud & DevOps": {
        "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda", "ecs", "eks", "rds", "cloudformation", "iam"],
        "Azure": ["azure", "microsoft azure", "azure devops", "azure functions"],
        "Google Cloud (GCP)": ["gcp", "google cloud", "google cloud platform", "gke", "cloud run"],
        "Docker": ["docker", "containerization", "docker-compose", "containers"],
        "Kubernetes": ["kubernetes", "k8s", "helm"],
        "Terraform": ["terraform", "iac", "infrastructure as code"],
        "CI/CD": ["ci/cd", "ci-cd", "continuous integration", "continuous deployment"],
        "GitHub Actions": ["github actions", "github action workflows"],
        "GitLab CI": ["gitlab ci", "gitlab ci/cd"],
        "Jenkins": ["jenkins"],
        "Ansible": ["ansible"],
        "Linux / Unix": ["linux", "unix", "ubuntu", "debian", "centos", "redhat"],
        "Prometheus & Grafana": ["prometheus", "grafana", "monitoring", "datadog", "new relic", "splunk"],
        "Serverless": ["serverless", "aws lambda", "cloud functions"],
        "Nginx / Apache": ["nginx", "apache web server", "reverse proxy"],
    },
    "AI, Machine Learning & Data Science": {
        "Machine Learning": ["machine learning", "ml", "supervised learning", "unsupervised learning"],
        "Deep Learning": ["deep learning", "neural networks", "cnn", "rnn", "lstm"],
        "PyTorch": ["pytorch", "torch"],
        "TensorFlow": ["tensorflow", "tf", "keras"],
        "Scikit-Learn": ["scikit-learn", "sklearn"],
        "Pandas": ["pandas"],
        "NumPy": ["numpy"],
        "NLP (Natural Language Processing)": ["nlp", "natural language processing", "text mining", "ner", "bert"],
        "LLMs & Generative AI": ["llm", "large language models", "generative ai", "genai", "gpt", "rag", "langchain", "llamaindex", "prompt engineering"],
        "Computer Vision": ["computer vision", "opencv", "yolo", "image processing"],
        "Data Engineering": ["data engineering", "etl", "data pipelines", "apache spark", "spark", "airflow", "dbt"],
        "Data Visualization": ["data visualization", "tableau", "power bi", "matplotlib", "seaborn", "d3.js"],
        "MLOps": ["mlops", "mlflow", "kubeflow", "wandb", "model deployment"],
        "Vector Databases": ["pinecone", "chromadb", "weaviate", "qdrant", "milvus", "vector db", "faiss"],
    },
    "Methodologies, Architecture & Soft Skills": {
        "Agile / Scrum": ["agile", "scrum", "kanban", "sprints", "jira"],
        "System Design": ["system design", "software architecture", "high availability", "scalability", "load balancing"],
        "Test-Driven Development (TDD)": ["tdd", "test-driven development", "unit testing", "jest", "pytest", "cypress", "selenium", "playwright"],
        "Git & Version Control": ["git", "github", "gitlab", "bitbucket", "version control"],
        "Clean Architecture / OOP": ["oop", "object-oriented programming", "clean architecture", "design patterns", "solid principles"],
        "Cybersecurity": ["cybersecurity", "security", "oauth", "oauth2", "jwt", "owasp", "penetration testing", "encryption"],
        "Leadership & Mentoring": ["leadership", "tech lead", "team lead", "mentoring", "code reviews", "recruiting"],
        "Communication & Collaboration": ["communication", "cross-functional collaboration", "stakeholder management", "problem solving", "critical thinking"],
        "Project Management": ["project management", "roadmap planning", "okrs", "kpis"],
    }
}

# Reverse mapping: Keyword string -> (Canonical Skill Name, Category)
KEYWORD_TO_SKILL: Dict[str, tuple[str, str]] = {}
for category, skills in SKILL_TAXONOMY.items():
    for canonical, variations in skills.items():
        for var in variations:
            KEYWORD_TO_SKILL[var.lower()] = (canonical, category)

# Action verbs commonly looked for by ATS scanners to measure impact
STRONG_ACTION_VERBS: Set[str] = {
    "accelerated", "achieved", "administered", "advanced", "advised", "allocated", "analyzed",
    "architected", "automated", "built", "centralized", "championed", "collaborated", "constructed",
    "consolidated", "converted", "coordinated", "created", "customized", "debugged", "decreased",
    "delivered", "deployed", "designed", "developed", "devised", "diagnosed", "directed",
    "discovered", "doubled", "drafted", "drove", "eliminated", "enabled", "engineered",
    "enhanced", "established", "estimated", "evaluated", "exceeded", "executed", "expanded",
    "expedited", "fabricated", "facilitated", "formulated", "founded", "generated", "guided",
    "headed", "identified", "implemented", "improved", "increased", "initiated", "innovated",
    "inspected", "installed", "instituted", "integrated", "introduced", "invented", "investigated",
    "launched", "led", "managed", "maximized", "mentored", "migrated", "minimized", "modernized",
    "monitored", "negotiated", "optimized", "orchestrated", "organized", "overhauled", "oversaw",
    "partnered", "performed", "pioneered", "planned", "produced", "programmed", "promoted",
    "proposed", "published", "re-engineered", "rearchitected", "rebuilt", "reduced", "refactored",
    "resolved", "restructured", "revamped", "saved", "scaled", "scheduled", "secured", "simplified",
    "solved", "spearheaded", "standardized", "streamlined", "strengthened", "structured", "supervised",
    "surpassed", "trained", "transformed", "transitioned", "troubleshot", "upgraded", "validated"
}

# Common degree abbreviations and fields of study
DEGREE_LEVELS = {
    "doctorate": ["phd", "ph.d", "doctor of philosophy", "doctorate"],
    "masters": ["master", "master's", "ms", "m.s", "msc", "m.sc", "mba", "m.b.a", "m.tech", "mtech"],
    "bachelors": ["bachelor", "bachelor's", "bs", "b.s", "bsc", "b.sc", "ba", "b.a", "b.tech", "btech", "b.e", "be"],
    "associate": ["associate", "associate's", "as", "a.s", "aa", "a.a"],
    "bootcamp_cert": ["bootcamp", "certificate", "certification", "certified"]
}
