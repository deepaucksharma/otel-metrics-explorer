/**
 * Script to generate GitHub issues from the implementation plan
 * 
 * Usage:
 * GITHUB_TOKEN=ghp_12345abcdef node scripts/generate-issues.js <phase-number>
 * 
 * Example:
 * GITHUB_TOKEN=ghp_12345abcdef node scripts/generate-issues.js 0
 */

import fs from 'fs';
import { Octokit } from '@octokit/rest';

// Constants
const REPO_OWNER = 'deepaucksharma';
const REPO_NAME = 'otel-metrics-explorer';
const IMPLEMENTATION_PLAN_PATH = './docs/72-implementation-Plan.md';

// Parse command line arguments
const phaseArg = process.argv[2];
const token = process.env.GITHUB_TOKEN;

if (!phaseArg || !token) {
  console.error('Usage: GITHUB_TOKEN=<token> node scripts/generate-issues.js <phase-number>');
  process.exit(1);
}

const phaseNumber = parseInt(phaseArg, 10);
if (isNaN(phaseNumber) || phaseNumber < 0 || phaseNumber > 6) {
  console.error('Phase number must be between 0 and 6');
  process.exit(1);
}

// Initialize Octokit
const octokit = new Octokit({
  auth: token
});

// Read implementation plan
const implementationPlan = fs.readFileSync(IMPLEMENTATION_PLAN_PATH, 'utf8');

// Main function
async function main() {
  try {
    console.log(`Generating issues for Phase ${phaseNumber}...`);
    
    // Extract tasks for the specified phase
    const tasks = extractTasksForPhase(implementationPlan, phaseNumber);
    console.log(`Found ${tasks.length} tasks`);
    
    if (tasks.length === 0) {
      console.error("No tasks found. Check implementation plan format.");
      process.exit(1);
    }
    
    // Create milestone if it doesn't exist
    let milestone;
    try {
      milestone = await getOrCreateMilestone(phaseNumber);
    } catch (error) {
      console.error("Failed to create milestone. Using null milestone.");
      milestone = { number: null };
    }
    
    // Create issues
    let createdCount = 0;
    for (const task of tasks) {
      try {
        await createIssue(task, milestone.number);
        console.log(`Created issue for ${task.id}: ${task.description}`);
        createdCount++;
      } catch (error) {
        console.error(`Failed to create issue for ${task.id}: ${error.message}`);
      }
    }
    
    console.log(`Done! Created ${createdCount} issues.`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Extract tasks for a specific phase
function extractTasksForPhase(plan, phase) {
  const tasks = [];
  
  // Find the phase section
  // Match any header containing "Phase X" where X is our phase number
  const phaseSectionRegex = new RegExp(`### Phase ${phase}[^#]*?(?=###|$)`, 'gs');
  const phaseMatch = plan.match(phaseSectionRegex);
  
  if (!phaseMatch) {
    // Try alternate format that might be used
    const altRegex = new RegExp(`## \\d+\\. Phase ${phase}[^#]*?(?=##|$)`, 'gs');
    const altMatch = plan.match(altRegex);
    
    if (!altMatch) {
      console.error(`Phase ${phase} not found in implementation plan. Scanning entire document...`);
      // If we can't find the section, just scan the whole document for tasks with IDs starting with the phase number
      const taskRegex = new RegExp(`\\| (${phase}-[0-9]+[a-z]) \\| ([^|]+) \\| ([^|]+) \\| ([0-9.]+d) \\| ([^|]*) \\|`, 'g');
      let match;
      
      while ((match = taskRegex.exec(plan)) !== null) {
        const [, id, ticket, description, duration, dependencies] = match;
        
        tasks.push({
          id,
          ticket: ticket.trim(),
          description: description.trim(),
          duration: duration.trim(),
          dependencies: dependencies.trim(),
          track: determineTrack(id),
          isInterface: isInterfaceTask(id, ticket),
          phase
        });
      }
      
      return tasks;
    }
    
    return extractTasksFromContent(altMatch[0], phase);
  }
  
  return extractTasksFromContent(phaseMatch[0], phase);
}

function extractTasksFromContent(content, phase) {
  const tasks = [];
  const tableRegex = /\| ([0-9]+-[0-9]+[a-z]) \| ([^|]+) \| ([^|]+) \| ([0-9.]+d) \| ([^|]*) \|/g;
  let match;
  
  while ((match = tableRegex.exec(content)) !== null) {
    const [, id, ticket, description, duration, dependencies] = match;
    
    tasks.push({
      id,
      ticket: ticket.trim(),
      description: description.trim(),
      duration: duration.trim(),
      dependencies: dependencies.trim(),
      track: determineTrackFromContent(content, id),
      isInterface: isInterfaceTask(id, ticket),
      phase
    });
  }
  
  return tasks;
}

function determineTrackFromContent(content, id) {
  // Try to find the track from section headers
  const section = findSectionForId(content, id);
  if (section) {
    const trackMatch = section.match(/#### Track ([A-Z])/);
    if (trackMatch) {
      return trackMatch[1];
    }
  }
  
  return determineTrack(id);
}

function findSectionForId(content, id) {
  // Split content by track headers
  const sections = content.split(/#### Track [A-Z]/);
  
  // Check each section for the ID
  for (let i = 1; i < sections.length; i++) {
    if (sections[i].includes(id)) {
      return "#### Track " + sections[i];
    }
  }
  
  return null;
}

function determineTrack(id) {
  // Try to infer from ID prefix
  const prefix = id.split('-')[0];
  switch (prefix[0]) {
    case '0': return 'Foundation';
    case '1': return 'A';
    case '2': return 'B';
    case '3': return 'C';
    case '4': return 'D';
    case '5': return 'E';
    case '6': return 'F';
    default: return 'Unknown';
  }
}

function isInterfaceTask(id, ticket) {
  return id.endsWith('a') && (
    ticket.includes('iface') || 
    ticket.includes('def') || 
    ticket.includes('interface') || 
    ticket.includes('api')
  );
}

// Get or create milestone
async function getOrCreateMilestone(phase) {
  const milestoneTitles = [
    'M0: Foundation',
    'M1: Basic Structure',
    'M2: Single Snapshot View',
    'M3: Diff Calculation',
    'M4: Cardinality Analysis',
    'M5: Config Export & Live Mode',
    'GA: Production Release'
  ];
  
  const title = milestoneTitles[phase];
  
  try {
    // Check if milestone exists
    const { data: milestones } = await octokit.issues.listMilestones({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      state: 'open'
    });
    
    const existing = milestones.find(m => m.title === title);
    if (existing) {
      return existing;
    }
    
    // Create new milestone
    const { data: milestone } = await octokit.issues.createMilestone({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title,
      description: `Tasks for Phase ${phase}`
    });
    
    return milestone;
  } catch (error) {
    console.error('Error with milestone:', error.message);
    throw error;
  }
}

// Create issue for a task
async function createIssue(task, milestoneNumber) {
  const issueType = task.isInterface ? 'Interface Definition' : 'Implementation Task';
  
  // Create labels
  const labels = [
    task.isInterface ? 'interface' : 'implementation',
    `track:${task.track}`,
    `phase:${task.phase}`
  ];
  
  // Generate issue body
  const body = generateIssueBody(task);
  
  try {
    await octokit.issues.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: `[${task.id}] ${task.description}`,
      body,
      labels,
      milestone: milestoneNumber
    });
  } catch (error) {
    console.error(`Error creating issue for ${task.id}:`, error.message);
    throw error;
  }
}

// Generate issue body based on template
function generateIssueBody(task) {
  if (task.isInterface) {
    return `## Interface Definition

**Ticket ID:** ${task.id}
**Track:** ${task.track}

### Purpose
${task.description}

### Dependencies
${task.dependencies || 'None'}

### Estimated Duration
${task.duration}

### Deliverables
- [ ] TypeScript interface/type definition
- [ ] Mock implementation that adheres to the interface
- [ ] Usage example for consumers
- [ ] Interface handshake meeting with consuming teams

This is an interface definition task that must be completed before implementation tickets can begin.`;
  } else {
    return `## Implementation Task

**Ticket ID:** ${task.id}
**Track:** ${task.track}

### Purpose
${task.description}

### Dependencies
${task.dependencies || 'None'}

### Estimated Duration
${task.duration}

### Acceptance Criteria
- [ ] Implementation follows the defined interface
- [ ] Unit tests cover all functionality
- [ ] Contract tests verify compatibility with consuming components
- [ ] Documentation is updated if needed

### Contract Tests
The following contract tests should verify the implementation:
- Contract test 1 (to be defined)
- Contract test 2 (to be defined)

This is an implementation task that depends on interface definition(s) being completed first.`;
  }
}

// Run the script
main();
