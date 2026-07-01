import { sequelize, RSVP, Comment } from './models';

async function seed() {
  try {
    await sequelize.sync({ force: true });

    // Seed sample RSVPs
    await RSVP.bulkCreate([
      {
        name: 'Person 1',
        attendance: 'Attending',
        guests: 1,
        wishes: 'Congratulations on your wedding! Wishing you a lifetime of love and happiness together. 💕',
      },
      {
        name: 'Person 2',
        attendance: 'Not Attending',
        guests: 1,
        wishes: 'So sorry I cannot attend, but I will be there in spirit. Congratulations! 💐',
      },
      {
        name: 'Person 3',
        attendance: 'Attending',
        guests: 2,
        wishes: 'Wishing you both a wonderful journey ahead. May your love continue to grow! 🌟',
      },
      {
        name: 'Person 4',
        attendance: 'Attending',
        guests: 1,
        wishes: 'So happy for you both! Here is to a beautiful forever. Cheers! 🥂',
      },
    ]);

    // Seed comments
    await Comment.bulkCreate([
      {
        name: 'Person 1',
        message: 'Congratulations on your wedding! Wishing you a lifetime of love and happiness together. 💕',
        attendance: 'Attending',
      },
      {
        name: 'Person 2',
        message: 'So sorry I cannot attend, but I will be there in spirit. Congratulations! 💐',
        attendance: 'Not Attending',
      },
      {
        name: 'Person 3',
        message: 'Wishing you both a wonderful journey ahead. May your love continue to grow! 🌟',
        attendance: 'Attending',
      },
      {
        name: 'Person 4',
        message: 'So happy for you both! Here is to a beautiful forever. Cheers! 🥂',
        attendance: 'Attending',
      },
    ]);

    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();