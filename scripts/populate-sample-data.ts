import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { firebaseConfig } from '../src/firebase/config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample user ID for testing (you can change this to a real user ID)
const testUserId = 'test-user-id';

// Sample tasks to populate
const sampleTasks = [
  {
    title: 'Complete project proposal',
    description: 'Finish writing and review the project proposal document',
    importanceLevel: 'high',
    dueDate: new Date('2025-11-10'),
    startTime: '09:00',
    endTime: '11:00',
    timeEstimate: '2 hours',
    isCompleted: false,
  },
  {
    title: 'Prepare presentation slides',
    description: 'Create slides for the Monday team meeting',
    importanceLevel: 'medium',
    dueDate: new Date('2025-11-08'),
    startTime: '14:00',
    endTime: '15:30',
    timeEstimate: '1.5 hours',
    isCompleted: false,
  },
  {
    title: 'Review code PRs',
    description: 'Review and provide feedback on pending pull requests',
    importanceLevel: 'high',
    dueDate: new Date('2025-11-06'),
    timeEstimate: '1 hour',
    isCompleted: true,
  },
  {
    title: 'Schedule team meeting',
    description: 'Set up a planning meeting for the next sprint',
    importanceLevel: 'medium',
    dueDate: new Date('2025-11-12'),
    timeEstimate: '30 minutes',
    isCompleted: false,
  },
  {
    title: 'Update documentation',
    description: 'Update the API documentation based on recent changes',
    importanceLevel: 'low',
    dueDate: new Date('2025-11-15'),
    timeEstimate: '2 hours',
    isCompleted: false,
  }
];

async function populateSampleTasks() {
  try {
    console.log('Starting to populate sample tasks...');

    for (const task of sampleTasks) {
      const taskRef = await addDoc(collection(db, 'users', testUserId, 'tasks'), {
        ...task,
        userId: testUserId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      console.log(`Added task: ${task.title} with ID: ${taskRef.id}`);
    }

    console.log('Sample tasks populated successfully!');
  } catch (error) {
    console.error('Error populating sample tasks:', error);
  }
}

// Run the script
populateSampleTasks();