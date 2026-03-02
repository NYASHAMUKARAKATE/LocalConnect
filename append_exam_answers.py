import os

roles = {
    "1_AI_ML_Engineer.md": {
        "role_name": "AI/ML Engineer",
        "contributions": "I was primarily responsible for integrating the 'Bridge Assistant', an AI chatbot for LocalConnect. I applied Neural Network principles (Forward/Back Propagation) to process natural language queries ('shops near me') and implemented the collaborative/content filtering algorithms. My key contribution was bridging our localized database and the NLP models without causing high latency.",
        "implementation": "During implementation, I developed the vector embeddings creation pipeline (`generate_embeddings.py`) and integrated the OpenAI API with FastAPI to provide context-aware recommendations."
    },
    "2_Network_Engineer.md": {
        "role_name": "Network Engineer",
        "contributions": "My role focused on establishing low-latency, secure communication between the LocalConnect frontend and backend. I configured the WebSocket architecture required for real-time live chat between users and shop owners, managed API routing, and resolved CORS constraints between environments.",
        "implementation": "I implemented the Uvicorn ASGI server configurations, developed WebSocket connection logic with reconnect strategies, and ensured the network could handle concurrent HTTP requests within the sub-2-second requirement constraint."
    },
    "3_Programmer2_Frontend.md": {
        "role_name": "Programmer 2 (Frontend)",
        "contributions": "I spearheaded the UI/UX conceptual design and implementation of LocalConnect. Drawing on 'Mobile-First' and 'Glassmorphism' principles, I developed scalable React components (like the Product Cards and Chat Bubbles). My focus was guaranteeing an intuitive layout.",
        "implementation": "Using React, TypeScript, and Tailwind CSS v4, I built out the responsive interfaces. I connected the frontend to the backend REST APIs and integrated Framer Motion for micro-interactions to deliver a polished, high-fidelity user experience."
    },
    "4_Programmer1_Backend.md": {
        "role_name": "Programmer 1 (Backend)",
        "contributions": "I served as the core architect for the backend business logic. I developed the RESTful APIs using FastAPI, establishing endpoints for the marketplace, authentication, and inventory management. I also implemented the Haversine formula script to enable the geospatial distance calculations.",
        "implementation": "I built the Python backend utilizing `async/await` features to handle live server traffic asynchronously. I utilized Pydantic for strict request validation and integrated SQLAlchemy ORM to safely process queries between the endpoints and the PostgreSQL/SQLite database."
    },
    "5_Security_Officer.md": {
        "role_name": "Security Officer",
        "contributions": "I was tasked with maintaining the platform's integrity. I implemented the JSON Web Token (JWT) authentication logic, secured password hashing via Passlib/Bcrypt, and created Role-Based Access Controls (RBAC) separating Admins, Shop Owners, Residents, and Ambassadors.",
        "implementation": "I developed FastAPIs dependency injection pipelines to automatically evaluate JWT Bearer Tokens on private paths, blocking unauthorized queries. I also conceptualized the Ambassador verification workflow to maintain physical data trust."
    },
    "6_Database_Administrator.md": {
        "role_name": "Database Administrator",
        "contributions": "I designed the relational entity models (Users, Shops, Products, Orders, Reviews) powering the LocalConnect platform. I was responsible for structuring tables to store Geospatial coordinates efficiently so proximity queries executed quickly, and migrating these models safely.",
        "implementation": "I leveraged SQLAlchemy to map the database entities and used Alembic to track migration versions. I also authored database seeding scripts (`init_db.py`, `seed_db.py`) capable of generating dynamic spatial data for testing."
    },
    "7_System_Tester.md": {
        "role_name": "System Tester",
        "contributions": "I maintained the quality assurance pipeline by proactively testing for bugs and edge cases before deployment. I designed the comprehensive testing environment utilizing Pytest and conducted User Acceptance Testing mapping the workflows of different system roles.",
        "implementation": "I developed automated endpoint tests (`test_endpoints.py`, `test_shop_owner.py`) to validate REST routing and authentication responses. I replicated '401 Unauthorized' and 'ResponseValidationError' faults until the code base proved stable."
    },
    "8_Deployment_Overview.md": {
        "role_name": "Deployment Engineer",
        "contributions": "I was responsible for porting the complex React frontend and FastAPI backend out of the local development state and into a scalable production cloud environment, structuring containerizations and managing SSL configurations.",
        "implementation": "Using tools like Vite for JavaScript bundling and Uvicorn for ASGI process hosting, I deployed the API endpoints securely. I managed production Environment Variables and coordinated Alembic database migrations onto the live servers."
    },
    "9_Project_Manager.md": {
        "role_name": "Project Manager",
        "contributions": "I orchestrated the Software Development Life Cycle (SDLC) using Agile methodologies. I divided the platform's features into manageable sprints, mapped out the Work Breakdown Structure, and managed engineering dependencies using the Critical Path Method (CPM).",
        "implementation": "During implementation, I monitored version control, tracked system integrations across the frontend and backend, mediated internal scope conflicts, and scheduled the User Acceptance Testing deliveries to meet academic deadlines."
    },
    "10_System_Engineer.md": {
        "role_name": "System Engineer",
        "contributions": "I handled the Object-Oriented Analysis and Design phases. I translated complex business requirements (like real-time AI and location-aware feeds) into strict Functional and Non-Functional engineering constraints, ensuring that the final architecture remained interoperable.",
        "implementation": "I designed the structural bridge between the distinct React contexts and the FastAPI backend. I oversaw the application of the Repository and Provider design patterns, tuning system performance to guarantee NFR latency targets."
    },
    "11_Software_Engineer.md": {
        "role_name": "Software Engineer",
        "contributions": "I acted as the versatile full-stack developer bridging gaps across the application. I refactored legacy configurations, aligned Pydantic database models with TypeScript interfaces, and built foundational UI components and API routes simultaneously.",
        "implementation": "I resolved critical cross-platform build errors (such as the Vite `jsx-dev-runtime` fault). I developed key data pipelines and wrote cleanly formatted frontend and backend boilerplate that specialized roles expanded upon."
    }
}

common_exam_content = """

---

## 📝 EXAM PREPARATION GUIDE (SCS 2214)

*Use the following predefined answers and talking points to ace the SCS 2214 Final Exam questions based on the LocalConnect project.*

### 1. Your Role & Contributions (2024 Q2)
**Discuss your role and the contributions you made:**
- **Role:** {role_name}
- **Contributions:** {contributions}
- **Implementation Impact:** {implementation}

### 2. Stakeholders & Their Roles (2025 Q2b / 2024 Q3)
**Outline the tasks of each group member and stakeholder:**
*   **System Users (External Stakeholders):**
    *   *Residents (Consumers):* Browse hyper-local products, interact with the AI assistant, make purchases.
    *   *Shop Owners:* Manage local inventory, process orders, chat with residents.
    *   *Bridge Ambassadors:* Verify shop legitimacy and product quality to maintain platform trust.
    *   *System Admins:* Monitor platform health, view demand heatmaps, handle disputes.
*   **Development Team (Internal Stakeholders / Group Members):**
    *   *Project Manager:* Managed Agile SDLC sprints, Gantt chart plotting, and task allocation (WBS).
    *   *System Engineer:* Handled Requirements Engineering, OOA/OOD, and architecture interoperability.
    *   *AI/ML Engineer:* Integrated the 'Bridge Assistant' NLP model and recommendation algorithms.
    *   *Frontend Programmer:* Developed the React/Tailwind mobile-first UI and handled state management.
    *   *Backend Programmer:* Developed the FastAPI REST routes and geospatial Haversine sorting logic.
    *   *Database Administrator:* Modeled the schema (SQLAlchemy) and managed geospatial data seeding.
    *   *Network Engineer:* Configured WebSocket pathways for live-chat and handled CORS restrictions.
    *   *Security Officer:* Handled JWT Authentication, RBAC, and payload encryption.
    *   *System Tester:* Wrote automated test scripts (Pytest), verified API endpoints, and ran UAT.

### 3. SDLC and Project Methodology (2024 Q1 / 2024 Q6 / 2025 Q6)
*   **Research Method:** We used a mixed-methods approach. Qualitative interviews identified pain points with existing global e-commerce platforms. Quantitative surveys defined the preferred pricing models and viable delivery radii for the local community.
*   **Project Proposal:** Addressed the gap in hyper-local commerce. Set clear objectives to build a "Digital Bridge Ecosystem" using GIS data and AI to connect local SMEs directly to nearby residents.
*   **Software Development Life Cycle (SDLC):** We utilized an **Agile SDLC** with iterative bi-weekly sprints. This allowed us to continuously adapt to feedback, moving from requirements gathering to wireframing (Figma), and finally iterative API/UI coding.
*   **Project Management:** Managed via a Work Breakdown Structure (WBS) to divide tasks, Gantt charts to visually map deliverables against deadlines (Alpha > Beta > Production), and the Critical Path Method (CPM) to manage bottlenecks like database mapping blocking frontend integration.
*   **Implementation Stage:** Implementation involved setting up the backend using Python/FastAPI and PostgreSQL, creating the frontend using React and Vite, integrating real-time WebSockets, and embedding OpenAI APIs for the Bridge Assistant.
*   **Why different stages & documentation? (2025 Q6):** Structured stages (Requirements -> Design -> Implementation -> Testing) prevent costly cascading errors. Documentation (like ERDs, API specs) acts as the single source of truth for the team, ensuring interoperability between complex parts (like connecting the React frontend strictly to the FastAPI backend).

### 4. Feasibility Study Justification (2025 Q5 / 2024 Q5)
**Defend/Justify the Feasibility Study in your ICT project:**
We *did* conduct a rigorous feasibility study to ensure the platform was viable across three dimensions:
1.  **Technical Feasibility:** We verified that modern frameworks (FastAPI + React) and mobile hardware could handle real-time geospatial distance calculations (Haversine Formula) and NLP processing strings efficiently (sub-2-second target).
2.  **Economic Feasibility:** Assessed the cost of running cloud servers and OpenAI API queries against the prospective subscription revenue from Shop Owners, confirming profitability.
3.  **Operational Feasibility:** Determined that the local community (both SMEs and residents) had the requisite digital literacy and smartphone access to adopt a mobile-first Progressive Web Application.

### 5. Business Model (2025 Q3)
**Design a business model for LocalConnect:**
*   **Value Proposition:** Providing SMEs immediate digital visibility to their exact geographical neighborhood, bypassing massive global competition. Providing residents ultra-fast discovery of nearby goods.
*   **Revenue Streams:** 
    *   Freemium model for Shop Owners (limited products free, premium tier for unlimited inventory/priority AI ranking).
    *   Targeted local demand heatmaps sold as data-subscriptions to larger franchise operators.
*   **Customer Segments:** SMEs without dedicated delivery fleets, and Gen-Y/Z consumers preferring digital local shopping.
*   **Key Partners:** Bridge Ambassadors (community verification) and local last-mile delivery riders.

### 6. System Modeling & Interfaces (2025 Q4 / 2024 Q4)
*   **UML Diagrams Developed:**
    *   *Use Case Diagram:* Showing Residents interacting with the AI Agent and the Cart, and Owners interacting with the Inventory Dashboard.
    *   *Class/ER Diagrams:* Detailing 1-to-many relationships (e.g., Shop -> Products) utilizing SQLAlchemy structures.
    *   *Sequence Diagrams:* Mapping the request lifecycle (Client -> Token Auth -> FastAPI Route -> DB Query -> JSON Response).
*   **Graphical User Interfaces (GUIs):** Built on "Mobile-First Accessibility" and "Glassmorphism".
    *   *Marketplace Feed:* A thumb-friendly vertical scroll of `ProductCard` components showing image, price, and exact distance (e.g., "1.2km away").
    *   *AI Chatbot View:* A sticky bottom input-field with real-time `ChatBubble` elements mimicking conversational SMS.
    *   *Shop Owner Dashboard:* A clean grid interface displaying total sales, inventory stock levels, and active pending orders formatted over a dark-mode theme.

### 7. Concept Definitions (2025 Q1 & Q2)
*   **Proposal:** A formal document pitching the project, defining the problem, objectives, and anticipated solutions to secure approval.
*   **Prototype:** An early, interactive mock-up (built in Figma) to test UI/UX assumptions and functionality before committing to code.
*   **Trademark:** A legally registered symbol or word representing LocalConnect, protecting our brand identity from unauthorized use.
*   **Stakeholder:** Any individual/group affected by the project (e.g., developers, shop owners, university graders).
*   **Patent vs Copyright:** A patent protects new inventions/functional mechanisms (e.g., a novel proximity algorithm), whereas a copyright protects the expression of an idea (e.g., the actual source code or UI artwork).
*   **Mobile App vs Web App:** A mobile app is natively installed on a device (Java/Swift), optimized for hardware. A web app (like LocalConnect) runs via a browser over the internet (React/HTML), offering better cross-platform compatibility but relying on network connections.
"""

os.chdir("c:/Users/Nyasha Mukarakate/Desktop/LocalConnect/Role_Documentation")

for filename, role_data in roles.items():
    if os.path.exists(filename):
        content_to_append = common_exam_content.format(
            role_name=role_data['role_name'],
            contributions=role_data['contributions'],
            implementation=role_data['implementation']
        )
        with open(filename, 'a', encoding='utf-8') as f:
            f.write(content_to_append)
        print(f"Updated {filename}")
    else:
        print(f"Skipped {filename} - not found")
