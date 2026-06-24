require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const TimeSlot = require('../models/TimeSlot');
const HealthRecord = require('../models/HealthRecord');
const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');
const Review = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ayucare';

const departments = [
  { name: 'Cardiology', description: 'Comprehensive cardiac care including diagnostics, treatment, and rehabilitation for heart-related conditions.', icon: 'heart', servicesOffered: ['ECG', 'Echocardiography', 'Cardiac Catheterization', 'Heart Surgery'] },
  { name: 'Neurology', description: 'Expert diagnosis and treatment of disorders of the nervous system including the brain and spinal cord.', icon: 'brain', servicesOffered: ['EEG', 'MRI Brain', 'Nerve Conduction Study', 'Stroke Management'] },
  { name: 'Pediatrics', description: 'Specialized medical care for infants, children, and adolescents with a focus on development and wellness.', icon: 'child', servicesOffered: ['Vaccination', 'Growth Monitoring', 'Pediatric Surgery', 'Neonatal Care'] },
  { name: 'Orthopedics', description: 'Treatment of musculoskeletal conditions including bones, joints, ligaments, and muscles.', icon: 'bone', servicesOffered: ['Joint Replacement', 'Fracture Treatment', 'Sports Medicine', 'Spine Surgery'] },
  { name: 'General Medicine', description: 'Primary healthcare services covering a broad range of medical conditions and preventive care.', icon: 'medical', servicesOffered: ['Health Checkup', 'Chronic Disease Management', 'Preventive Care', 'Internal Medicine'] },
  { name: 'Dermatology', description: 'Diagnosis and treatment of skin, hair, and nail conditions with advanced cosmetic procedures.', icon: 'skin', servicesOffered: ['Skin Biopsy', 'Laser Treatment', 'Cosmetic Dermatology', 'Acne Treatment'] },
];

const doctorProfiles = [
  { name: 'Dr. Sarah Jenkins', email: 'sarah.jenkins@ayucare.com', specialization: 'Senior Cardiologist', department: 'Cardiology', experience: 15, fee: 1500, bio: 'Leading cardiologist with 15+ years of experience in interventional cardiology and cardiac surgery.', gender: 'female' },
  { name: 'Dr. Michael Chen', email: 'michael.chen@ayucare.com', specialization: 'Neurologist', department: 'Neurology', experience: 12, fee: 1200, bio: 'Expert neurologist specializing in epilepsy, stroke management, and neurodegenerative diseases.', gender: 'male' },
  { name: 'Dr. Elena Rodriguez', email: 'elena.rodriguez@ayucare.com', specialization: 'Pediatrician', department: 'Pediatrics', experience: 10, fee: 800, bio: 'Compassionate pediatrician dedicated to providing holistic care for children from infancy to adolescence.', gender: 'female' },
  { name: 'Dr. James Wilson', email: 'james.wilson@ayucare.com', specialization: 'Orthopedic Surgeon', department: 'Orthopedics', experience: 18, fee: 1800, bio: 'Renowned orthopedic surgeon with expertise in joint replacement and sports injury management.', gender: 'male' },
  { name: 'Dr. Priya Sharma', email: 'priya.sharma@ayucare.com', specialization: 'General Physician', department: 'General Medicine', experience: 8, fee: 600, bio: 'Experienced general physician focused on preventive medicine and chronic disease management.', gender: 'female' },
  { name: 'Dr. David Park', email: 'david.park@ayucare.com', specialization: 'Dermatologist', department: 'Dermatology', experience: 11, fee: 1000, bio: 'Board-certified dermatologist offering advanced treatments for skin conditions and cosmetic procedures.', gender: 'male' },
  { name: 'Dr. Ananya Patel', email: 'ananya.patel@ayucare.com', specialization: 'Cardiologist', department: 'Cardiology', experience: 9, fee: 1200, bio: 'Cardiologist specializing in non-invasive cardiac imaging and preventive cardiology.', gender: 'female' },
  { name: 'Dr. Robert Kim', email: 'robert.kim@ayucare.com', specialization: 'Pediatric Neurologist', department: 'Neurology', experience: 14, fee: 1400, bio: 'Pediatric neurologist with expertise in childhood epilepsy and developmental disorders.', gender: 'male' },
];

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Department.deleteMany({}),
      Appointment.deleteMany({}),
      TimeSlot.deleteMany({}),
      HealthRecord.deleteMany({}),
      Prescription.deleteMany({}),
      Notification.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('Cleared existing data.');

    // Create departments
    const createdDepts = await Department.insertMany(departments);
    const deptMap = {};
    createdDepts.forEach((d) => { deptMap[d.name] = d._id; });
    console.log(`Created ${createdDepts.length} departments.`);

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@ayucare.com',
      password: 'Admin@123',
      phone: '+1-800-AYUCARE',
      role: 'admin',
      gender: 'male',
      age: 40,
      isActive: true,
    });
    console.log('Created admin user: admin@ayucare.com / Admin@123');

    // Create doctor users and profiles
    const doctorDocs = [];
    for (const doc of doctorProfiles) {
      const user = await User.create({
        name: doc.name,
        email: doc.email,
        password: 'Doctor@123',
        phone: `+1-555-${Math.floor(1000 + Math.random() * 9000)}`,
        role: 'doctor',
        gender: doc.gender,
        age: 30 + doc.experience,
        isActive: true,
      });

      const doctor = await Doctor.create({
        userId: user._id,
        department: deptMap[doc.department],
        specialization: doc.specialization,
        experience: doc.experience,
        consultationFee: doc.fee,
        bio: doc.bio,
        qualifications: [
          { degree: 'MBBS', institution: 'Medical University', year: 2020 - doc.experience },
          { degree: 'MD', institution: 'Specialty Hospital', year: 2023 - doc.experience + 3 },
        ],
        rating: (3.5 + Math.random() * 1.5).toFixed(1),
        totalReviews: Math.floor(20 + Math.random() * 80),
        availability: {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: '09:00', end: '13:00', available: true },
          sunday: { start: '', end: '', available: false },
        },
        languages: ['English', 'Hindi'],
        isAvailable: true,
      });

      doctorDocs.push({ user, doctor });
    }
    console.log(`Created ${doctorDocs.length} doctors.`);

    // Generate time slots for next 14 days for each doctor
    const slotsToCreate = [];
    for (const { doctor } of doctorDocs) {
      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        date.setHours(0, 0, 0, 0);

        if (date.getDay() === 0) continue; // Skip Sundays

        for (const slot of timeSlots) {
          const endIdx = timeSlots.indexOf(slot) + 1;
          slotsToCreate.push({
            doctor: doctor._id,
            date: new Date(date),
            startTime: slot,
            endTime: endIdx < timeSlots.length ? timeSlots[endIdx] : '05:00 PM',
            isBooked: false,
          });
        }
      }
    }
    await TimeSlot.insertMany(slotsToCreate);
    console.log(`Created ${slotsToCreate.length} time slots.`);

    // Create sample patients
    const patients = [];
    const patientData = [
      { name: 'John Doe', email: 'john@example.com', phone: '+1-555-1001', gender: 'male', age: 32, bloodGroup: 'O+' },
      { name: 'Jane Smith', email: 'jane@example.com', phone: '+1-555-1002', gender: 'female', age: 28, bloodGroup: 'A+' },
      { name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '+91-9876543210', gender: 'male', age: 45, bloodGroup: 'B+' },
    ];

    for (const p of patientData) {
      const user = await User.create({
        ...p,
        password: 'Patient@123',
        role: 'patient',
        isActive: true,
      });
      patients.push(user);
    }
    console.log(`Created ${patients.length} sample patients. Login: john@example.com / Patient@123`);

    // Create sample appointments
    const sampleAppointments = [];
    const statuses = ['completed', 'completed', 'confirmed', 'cancelled', 'completed'];
    const reasons = [
      'Regular heart checkup',
      'Persistent headaches',
      'Annual physical examination',
      'Joint pain in knee',
      'Follow-up consultation',
    ];

    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() - 30 + i * 15);
      const doctor = doctorDocs[i % doctorDocs.length];
      const patient = patients[i % patients.length];

      const appointment = await Appointment.create({
        patient: patient._id,
        doctor: doctor.doctor._id,
        department: doctor.doctor.department,
        date,
        timeSlot: { startTime: timeSlots[i * 2], endTime: timeSlots[i * 2 + 1] },
        status: statuses[i],
        reason: reasons[i],
        consultationFee: doctor.doctor.consultationFee,
        paymentStatus: statuses[i] === 'completed' ? 'paid' : 'pending',
      });
      sampleAppointments.push(appointment);
    }

    // Create upcoming appointment for John
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 1);
    const upcomingAppointment = await Appointment.create({
      patient: patients[0]._id,
      doctor: doctorDocs[0].doctor._id,
      department: doctorDocs[0].doctor.department,
      date: upcomingDate,
      timeSlot: { startTime: '10:30 AM', endTime: '11:00 AM' },
      status: 'confirmed',
      reason: 'Follow-up cardiac consultation',
      consultationFee: doctorDocs[0].doctor.consultationFee,
    });
    console.log(`Created ${sampleAppointments.length + 1} appointments.`);

    // Create health records for John
    await HealthRecord.create({
      patient: patients[0]._id,
      heartRate: { value: 72, unit: 'bpm' },
      bloodPressure: { systolic: 120, diastolic: 80, unit: 'mmHg' },
      bloodGlucose: { value: 98, unit: 'mg/dL' },
      bodyWeight: { value: 74.5, unit: 'kg' },
      bodyTemperature: { value: 36.6, unit: '°C' },
      oxygenSaturation: { value: 98, unit: '%' },
      allergies: ['Penicillin'],
      recordedBy: doctorDocs[0].user._id,
    });
    console.log('Created health records.');

    // Create sample prescription
    if (sampleAppointments.length > 0) {
      await Prescription.create({
        appointment: sampleAppointments[0]._id,
        patient: patients[0]._id,
        doctor: doctorDocs[0].doctor._id,
        diagnosis: 'Mild hypertension with borderline cholesterol levels',
        medications: [
          { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days', instructions: 'Take in the morning with food' },
          { name: 'Atorvastatin', dosage: '10mg', frequency: 'Once daily at bedtime', duration: '30 days', instructions: 'Take at night before sleep' },
          { name: 'Vitamin D3', dosage: '60000 IU', frequency: 'Once weekly', duration: '8 weeks', instructions: 'Take with milk after lunch' },
        ],
        notes: 'Monitor blood pressure daily. Follow-up after 4 weeks.',
        followUpRecommended: true,
        followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        labTestsRecommended: ['Lipid Profile', 'HbA1c', 'Thyroid Panel'],
        dietaryAdvice: 'Reduce sodium intake. Include more fruits and vegetables. Limit processed foods.',
      });
      console.log('Created sample prescription.');
    }

    // Create notifications for John
    const notificationsData = [
      { title: 'Lab Results Ready', message: 'Your Blood Chemistry report is now available for download.', type: 'lab-result', icon: 'lab', priority: 'high' },
      { title: 'Prescription Renewed', message: 'Dr. Sarah Jenkins has renewed your Vitamin D3 prescription.', type: 'prescription', icon: 'prescription', priority: 'medium' },
      { title: 'Feedback Request', message: 'How was your visit with Dr. Michael Chen? Let us know!', type: 'feedback', icon: 'star', priority: 'low' },
      { title: 'Appointment Reminder', message: 'Reminder: Your appointment with Dr. Sarah Jenkins is tomorrow at 10:30 AM.', type: 'reminder', icon: 'clock', priority: 'high' },
      { title: 'Welcome to AyuCare!', message: 'Thank you for joining AyuCare Hospital. Start by booking your first appointment.', type: 'system', icon: 'bell', priority: 'medium', isRead: true },
    ];

    for (const notif of notificationsData) {
      await Notification.create({ user: patients[0]._id, ...notif });
    }
    console.log('Created notifications.');

    // Create sample reviews
    for (let i = 0; i < doctorDocs.length; i++) {
      const reviewerPatient = patients[i % patients.length];
      await Review.create({
        patient: reviewerPatient._id,
        doctor: doctorDocs[i].doctor._id,
        rating: 4 + (i % 2),
        comment: [
          'Excellent doctor! Very thorough and caring.',
          'Great experience. Highly recommended.',
          'Very knowledgeable and patient.',
          'Wonderful bedside manner. Explained everything clearly.',
          'Best doctor in the department.',
          'Very professional and attentive.',
          'Exceptional care and treatment.',
          'Highly skilled and compassionate.',
        ][i],
        isVerified: true,
      });
    }
    console.log('Created reviews.');

    console.log('\n========================================');
    console.log('   Database seeded successfully! 🌱');
    console.log('========================================');
    console.log('\nLogin Credentials:');
    console.log('  Admin:   admin@ayucare.com / Admin@123');
    console.log('  Doctor:  sarah.jenkins@ayucare.com / Doctor@123');
    console.log('  Patient: john@example.com / Patient@123');
    console.log('========================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();
