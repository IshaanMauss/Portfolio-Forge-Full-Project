// src/api/mockEnhanceAPI.js (Comprehensive Version)

export async function getEnhancedDescription(type, input) {
  console.log(`%cCalling Mock AI for type: "${type}"`, 'color: #64ffda;');
  console.log('%cInput:', 'color: #8892b0;', input);

  let response;
  switch (type) {
    case 'bio':
      response = { enhancedText: `An AI-enhanced bio based on these interests: ${input.interests}. I am a passionate and driven student with a strong foundation in software development and a keen interest in leveraging technology to solve real-world problems.` };
      break;
    case 'project':
      response = { enhancedText: `A professionally enhanced description for '${input.title}'. This project showcases skills in ${input.keywords} and demonstrates a strong ability to deliver high-quality web solutions.` };
      break;
    
    // --- FIX START: Separated 'skills' into 'hardSkills' and 'softSkills' ---
    case 'hardSkills':
      const hardSkills = [
        'Data Structures', 'Algorithms', 'Object-Oriented Programming (OOP)', 'Functional Programming', 'C', 'C++', 'Java', 'Python', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin', 'PHP', 'Ruby', 'Perl', 'Assembly Language', 'Dynamic Programming', 'Recursion', 'Big O Notation', 'Sorting Algorithms',
        'HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Next.js', 'Svelte', 'jQuery', 'Bootstrap', 'Tailwind CSS', 'Sass/SCSS', 'Webpack', 'Babel', 'Redux', 'MobX', 'GraphQL', 'Apollo Client', 'Gatsby', 'Ember.js', 'Web Components', 'WebAssembly', 'Jest', 'Cypress',
        'Node.js', 'Express.js', 'Django', 'Flask', 'Ruby on Rails', 'ASP.NET Core', 'Spring Boot', 'Laravel', 'FastAPI', 'Koa', 'NestJS', 'Serverless Architecture', 'Microservices', 'REST APIs', 'WebSockets', 'Nginx', 'Apache', 'API Design',
        'SQL', 'MySQL', 'PostgreSQL', 'Microsoft SQL Server', 'MongoDB', 'Redis', 'Firebase', 'Oracle', 'NoSQL', 'SQLite', 'Cassandra', 'Elasticsearch', 'Database Design', 'Query Optimization', 'Transactions', 'Indexing', 'DynamoDB',
        'Android (Java/Kotlin)', 'iOS (Swift/Objective-C)', 'React Native', 'Flutter', 'SwiftUI', 'Xamarin', 'Ionic', 'NativeScript', 'Core Data', 'Realm', 'Mobile UI/UX Design',
        'Amazon Web Services (AWS)', 'Microsoft Azure', 'Google Cloud Platform (GCP)', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Git', 'GitHub Actions', 'Terraform', 'Ansible', 'Puppet', 'Chef', 'Prometheus', 'Grafana', 'Datadog', 'Splunk', 'Infrastructure as Code (IaC)', 'Site Reliability Engineering (SRE)', 'Heroku', 'DigitalOcean', 'Vercel',
        'Machine Learning', 'Deep Learning', 'Natural Language Processing (NLP)', 'Computer Vision', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Keras', 'Jupyter Notebooks', 'Data Preprocessing', 'Feature Engineering', 'Model Training', 'Reinforcement Learning', 'Generative AI', 'LLMs', 'OpenCV',
        'Data Analysis', 'Data Visualization', 'R', 'Matlab', 'Tableau', 'Power BI', 'ETL Processes', 'Data Warehousing', 'Big Data Technologies', 'Hadoop', 'Spark', 'Statistical Analysis', 'A/B Testing', 'Looker',
        'Agile Methodologies', 'Scrum', 'JIRA', 'Linux/Unix', 'Shell Scripting', 'GraphQL', 'Postman', 'Swagger/OpenAPI', 'UML', 'Design Patterns', 'Test-Driven Development (TDD)', 'Kanban', 'Confluence',
        'AutoCAD', 'SolidWorks', 'MATLAB', 'Simulink', 'Verilog', 'VHDL', 'LabVIEW', 'PLC Programming', 'Circuit Design', 'Chemical Process Simulation', 'Aspen HYSYS', 'CFD', 'FEA', '3D Modeling', 'Robotics Process Automation (RPA)', 'Embedded Systems'
      ];
      response = { suggestions: hardSkills.filter(s => s.toLowerCase().startsWith(input.partial.toLowerCase())) };
      break;

    case 'softSkills':
      const softSkills = [
        'Problem Solving', 'Critical Thinking', 'Teamwork', 'Communication', 'Collaboration', 'Leadership', 'Adaptability', 'Time Management', 'Work Ethic', 'Creativity', 'Attention to Detail', 'Interpersonal Skills', 'Mentoring', 'Public Speaking', 'Active Listening', 'Negotiation', 'Conflict Resolution', 'Emotional Intelligence', 'Decision Making', 'Stress Management', 'Patience', 'Empathy', 'Feedback Delivery', 'Persuasion', 'Networking', 'Project Management', 'Client Relations', 'Stakeholder Management', 'Presentation Skills', 'Written Communication', 'Verbal Communication', 'Team Building', 'Coaching', 'Delegation', 'Motivation', 'Resilience', 'Self-awareness', 'Open-mindedness', 'Curiosity', 'Strategic Planning', 'Resourcefulness', 'Initiative'
      ];
      response = { suggestions: softSkills.filter(s => s.toLowerCase().startsWith(input.partial.toLowerCase())) };
      break;
    // --- FIX END ---

    case 'interests':
      const allInterests = [
        'Open Source Contribution', 'Competitive Programming', 'Web Development', 'Mobile App Development', 'Artificial Intelligence', 'Machine Learning', 'Data Science', 'Cybersecurity', 'Cloud Computing', 'Game Development', 'UI/UX Design', 'Robotics', 'Internet of Things (IoT)', 'Blockchain', 'Technical Writing', 'Hackathons', 'Startups & Entrepreneurship', 'Tech Blogging', 'Reading Scientific Journals', 'Attending Tech Meetups', 'Building Personal Projects', 'Data Visualization', 'Ethical Hacking', 'Quantum Computing', 'Augmented Reality (AR)', 'Virtual Reality (VR)', '3D Printing', 'Home Automation', 'Stock Market Analysis', 'Financial Modeling', 'Photography', 'Videography', 'Music Production', 'Graphic Design', 'Creative Writing', 'Learning New Languages', 'Traveling', 'Hiking', 'Cooking', 'Playing Musical Instruments', 'Chess', 'Meditation', 'Volunteering', 'Teaching/Tutoring', 'Automating Tasks', 'History', 'Philosophy', 'Physics', 'Astronomy', 'Environmental Sustainability', 'Digital Art', 'Podcasting'
      ];
      response = { suggestions: allInterests.filter(i => i.toLowerCase().includes(input.partial.toLowerCase())) };
      break;
    case 'theme':
        if (input.mood?.toLowerCase().includes('funny')) {
            response = { suggestedTheme: { backgroundColor: '#FFF8E7', textColor: '#5D4037', accentColor: '#FF6F61' } };
        } else if (input.mood?.toLowerCase().includes('dark')) {
            response = { suggestedTheme: { backgroundColor: '#121212', textColor: '#EAEAEA', accentColor: '#BB86FC' } };
        } else {
            response = { suggestedTheme: { backgroundColor: '#1D2D44', textColor: '#F0EBD8', accentColor: '#F7C873' } };
        }
        break;
    default:
      response = { error: 'Invalid AI request type' };
  }
  
  console.log('%cMock AI Response:', 'color: #64ffda;', response);
  return response;
}