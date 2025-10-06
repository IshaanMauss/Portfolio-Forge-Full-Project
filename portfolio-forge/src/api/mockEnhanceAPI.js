// src/api/mockEnhanceAPI.js (Comprehensive Version)

export async function getEnhancedDescription(type, input) {
  console.log(`%cCalling Mock AI for type: "${type}"`, 'color: #64ffda;');
  console.log('%cInput:', 'color: #8892b0;', input);

  // No network delay needed for a mock API
  // await new Promise(resolve => setTimeout(resolve, 400)); 

  let response;
  switch (type) {
    case 'bio':
      response = { enhancedText: `An AI-enhanced bio based on these interests: ${input.interests}. I am a passionate and driven student with a strong foundation in software development and a keen interest in leveraging technology to solve real-world problems.` };
      break;
    case 'project':
      response = { enhancedText: `A professionally enhanced description for '${input.title}'. This project showcases skills in ${input.keywords} and demonstrates a strong ability to deliver high-quality web solutions.` };
      break;
    case 'skills':
      const hardSkills = [
        // Core CS & Programming
        'Data Structures', 'Algorithms', 'Object-Oriented Programming (OOP)', 'Functional Programming', 'C', 'C++', 'Java', 'Python', 'C#',
        
        // Web Development - Frontend
        'HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Next.js', 'Svelte', 'jQuery', 'Bootstrap', 'Tailwind CSS', 'Sass/SCSS',
        
        // Web Development - Backend
        'Node.js', 'Express.js', 'Django', 'Flask', 'Ruby on Rails', 'ASP.NET Core', 'Spring Boot', 'PHP', 'Laravel',
        
        // Databases
        'SQL', 'MySQL', 'PostgreSQL', 'Microsoft SQL Server', 'MongoDB', 'Redis', 'Firebase', 'Oracle', 'NoSQL',
        
        // Mobile App Development
        'Android (Java/Kotlin)', 'iOS (Swift/Objective-C)', 'React Native', 'Flutter', 'SwiftUI',
        
        // Cloud & DevOps
        'Amazon Web Services (AWS)', 'Microsoft Azure', 'Google Cloud Platform (GCP)', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Git', 'GitHub Actions', 'Terraform', 'Ansible',
        
        // AI & Machine Learning
        'Machine Learning', 'Deep Learning', 'Natural Language Processing (NLP)', 'Computer Vision', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
        
        // Data Science & Analytics
        'Data Analysis', 'Data Visualization', 'R', 'Matlab', 'Tableau', 'Power BI',
        
        // Software Engineering & Tools
        'Agile Methodologies', 'Scrum', 'JIRA', 'Linux/Unix', 'Shell Scripting', 'REST APIs', 'GraphQL', 'Microservices',
        
        // Other Engineering Fields
        'AutoCAD', 'SolidWorks', 'MATLAB', 'Simulink', 'Verilog', 'VHDL', 'LabVIEW', 'PLC Programming', 'Circuit Design', 'Chemical Process Simulation', 'Aspen HYSYS', 'CFD', 'FEA'
      ];

      const softSkills = [
        'Problem Solving', 'Critical Thinking', 'Teamwork', 'Communication', 'Collaboration', 'Leadership', 'Adaptability', 'Time Management', 'Work Ethic', 'Creativity', 'Attention to Detail', 'Interpersonal Skills', 'Mentoring', 'Public Speaking'
      ];
      
      const allSkills = [...hardSkills, ...softSkills];
      response = { suggestions: allSkills.filter(s => s.toLowerCase().startsWith(input.partial.toLowerCase())) };
      break;
    case 'interests':
      const allInterests = [
        'Open Source Contribution', 'Competitive Programming', 'Web Development', 'Mobile App Development', 'Artificial Intelligence', 'Machine Learning', 'Data Science', 'Cybersecurity', 'Cloud Computing', 'Game Development', 'UI/UX Design', 'Robotics', 'Internet of Things (IoT)', 'Blockchain', 'Technical Writing', 'Hackathons', 'Startups & Entrepreneurship'
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