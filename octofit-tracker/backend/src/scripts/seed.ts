import mongoose from 'mongoose';
import { Activity } from '../models/Activity.js';
import { Leaderboard } from '../models/Leaderboard.js';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';
import { Workout } from '../models/Workout.js';

const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/octofit_db';

const teamSeeds = [
  { name: 'Trail Blazers', description: 'A team focused on getting outside and moving.' },
  { name: 'Strength Squad', description: 'A team building strength one session at a time.' },
];

const userSeeds = [
  { username: 'alex-morgan', name: 'Alex Morgan', email: 'alex.morgan@example.com', teamName: 'Trail Blazers' },
  { username: 'jamie-chen', name: 'Jamie Chen', email: 'jamie.chen@example.com', teamName: 'Trail Blazers' },
  { username: 'sam-rivera', name: 'Sam Rivera', email: 'sam.rivera@example.com', teamName: 'Strength Squad' },
  { username: 'taylor-jones', name: 'Taylor Jones', email: 'taylor.jones@example.com', teamName: 'Strength Squad' },
];

const activitySeeds = [
  { username: 'alex-morgan', activityType: 'running' as const, durationMinutes: 32, distanceKm: 5.2, points: 52, completedAt: new Date('2026-09-24T08:00:00Z') },
  { username: 'alex-morgan', activityType: 'strength' as const, durationMinutes: 40, points: 40, completedAt: new Date('2026-09-26T08:00:00Z') },
  { username: 'jamie-chen', activityType: 'walking' as const, durationMinutes: 45, distanceKm: 3.8, points: 38, completedAt: new Date('2026-09-25T08:00:00Z') },
  { username: 'sam-rivera', activityType: 'strength' as const, durationMinutes: 50, points: 50, completedAt: new Date('2026-09-25T08:00:00Z') },
  { username: 'sam-rivera', activityType: 'running' as const, durationMinutes: 28, distanceKm: 4.6, points: 46, completedAt: new Date('2026-09-27T08:00:00Z') },
  { username: 'taylor-jones', activityType: 'walking' as const, durationMinutes: 35, distanceKm: 2.9, points: 29, completedAt: new Date('2026-09-26T08:00:00Z') },
];

const workoutSeeds = [
  { title: 'Easy 5K Run', description: 'A conversational-pace run to build endurance.', activityType: 'running' as const, difficulty: 'beginner' as const, durationMinutes: 30 },
  { title: 'Power Walk', description: 'A brisk walk with a steady, sustainable pace.', activityType: 'walking' as const, difficulty: 'beginner' as const, durationMinutes: 35 },
  { title: 'Full-Body Strength', description: 'A balanced strength session for the major muscle groups.', activityType: 'strength' as const, difficulty: 'intermediate' as const, durationMinutes: 45 },
];

/**
 * Seed the octofit_db database with test data
 */
async function seedDatabase() {
  try {
    await mongoose.connect(connectionString);

    console.log('Connected to octofit_db');

    const teams = await Promise.all(
      teamSeeds.map(({ name, description }) =>
        Team.findOneAndUpdate(
          { name },
          { $set: { description } },
          { upsert: true, returnDocument: 'after', runValidators: true },
        ),
      ),
    );
    const teamsByName = new Map(teams.filter((team) => team !== null).map((team) => [team.name, team]));

    const users = await Promise.all(
      userSeeds.map(async ({ teamName, ...userSeed }) => {
        const team = teamsByName.get(teamName);
        if (!team) {
          throw new Error(`Seed team not found: ${teamName}`);
        }

        return User.findOneAndUpdate(
          { username: userSeed.username },
          { $set: { ...userSeed, team: team._id } },
          { upsert: true, returnDocument: 'after', runValidators: true },
        );
      }),
    );
    const usersByUsername = new Map(
      users.filter((user) => user !== null).map((user) => [user.username, user]),
    );

    await Promise.all(
      teamSeeds.map(async ({ name }) => {
        const team = teamsByName.get(name);
        if (!team) {
          throw new Error(`Seed team not found: ${name}`);
        }

        const members = userSeeds
          .filter((user) => user.teamName === name)
          .map((user) => usersByUsername.get(user.username))
          .filter((user) => user !== undefined)
          .map((user) => user._id);

        await Team.updateOne({ _id: team._id }, { $set: { members } }, { runValidators: true });
      }),
    );

    await Promise.all(
      activitySeeds.map(async ({ username, ...activitySeed }) => {
        const user = usersByUsername.get(username);
        if (!user) {
          throw new Error(`Seed user not found: ${username}`);
        }

        await Activity.findOneAndUpdate(
          { user: user._id, activityType: activitySeed.activityType, completedAt: activitySeed.completedAt },
          { $set: { ...activitySeed, user: user._id } },
          { upsert: true, returnDocument: 'after', runValidators: true },
        );
      }),
    );

    const pointsByUsername = new Map<string, number>();
    for (const { username, points } of activitySeeds) {
      pointsByUsername.set(username, (pointsByUsername.get(username) ?? 0) + points);
    }

    await Promise.all(
      Array.from(pointsByUsername, async ([username, points]) => {
        const user = usersByUsername.get(username);
        if (!user) {
          throw new Error(`Seed user not found: ${username}`);
        }

        await Leaderboard.findOneAndUpdate(
          { user: user._id, period: 'all-time' },
          { $set: { points } },
          { upsert: true, returnDocument: 'after', runValidators: true },
        );
      }),
    );

    await Promise.all(
      workoutSeeds.map(({ title, ...workoutSeed }) =>
        Workout.findOneAndUpdate(
          { title },
          { $set: workoutSeed },
          { upsert: true, returnDocument: 'after', runValidators: true },
        ),
      ),
    );

    console.log('Database seeding complete');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
