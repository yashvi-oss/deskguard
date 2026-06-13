import { query } from '../config/database';
import { deskService } from '../services/deskService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export const seedDatabase = async () => {
  try {
    logger.info('Seeding database with sample data...');

    // Create sample users
    const studentId = uuidv4();
    const librarianId = uuidv4();

    await query(
      `INSERT INTO users (id, email, name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [studentId, 'student@example.com', 'John Student', 'student']
    );

    await query(
      `INSERT INTO users (id, email, name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [librarianId, 'librarian@example.com', 'Jane Librarian', 'librarian']
    );

    // Create 50 sample desks (5 floors, 10 desks per floor)
    let deskCounter = 1;
    for (let floor = 1; floor <= 5; floor++) {
      for (let i = 1; i <= 10; i++) {
        const section = String.fromCharCode(64 + floor); // A, B, C, D, E
        await deskService.createDesk(deskCounter, floor, section);
        deskCounter++;
      }
    }

    logger.info('✅ Database seeded successfully');
    logger.info(`Created 1 student user and 1 librarian user`);
    logger.info(`Created 50 desks (5 floors × 10 desks per floor)`);
  } catch (error) {
    logger.warn('Seeding skipped (data may already exist)', error);
  }
};
