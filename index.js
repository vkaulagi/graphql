import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  
  type Doctor {
    doctor_id: ID!
    doctor_name: String
    clinic_name: String
    specialty: String
    available_timeslots: [Int]
  }
  
  type Patient {
    patient_id: ID!
    patient_name: String
    appointment_timeslot: Int
  }
  
  type Appointment {
    appointment_id: ID!
    doctor_id: ID
    patient_id: ID
  }

  
  type Query {
    getDoctorDetails(doctor_id : ID!): DoctorDetails
    getDoctorSlots(doctor_id : ID!): [Int]
  }

  type DoctorDetails {
    doctor_name: String
    clinic_name: String
    specialty: String
  }


  type Mutation {
    bookAppointment(doctor_id: ID!, patient_id: ID!, appointment_timeslot: Int): AppointmentConfirmation
    cancelAppointment(appointment_id: ID!): DoctorSlotFreed
    updatePatientName(appointment_id: ID!, patient_name: String): NewPatientAppointment
  }

  type AppointmentConfirmation {
    doctor_name: String
    available_timeslots: [Int]
    patient_name: String
    appointment_timeslot: Int
  }

  type DoctorSlotFreed {
    doctor_id: ID!
    available_timeslots: [Int]
  }

  type NewPatientAppointment {
    patient_id: ID!
    patient_name: String
    appointment_timeslot: Int
  }
`;

const doctors = [
  {
    doctor_id: 1,
    doctor_name: 'alpha',
    clinic_name: 'clinic1',
    specialty: 'general_physician',
    available_timeslots: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    doctor_id: 2,
    doctor_name: 'beta',
    clinic_name: 'clinic2',
    specialty: 'gynecologist',
    available_timeslots: [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    doctor_id: 3,
    doctor_name: 'gamma',
    clinic_name: 'clinic3',
    specialty: 'orthopedic',
    available_timeslots: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
];

const patients = [
  {
    patient_id: 100,
    patient_name: 'alice',
    appointment_timeslot: 2,
  },
  {
    patient_id: 200,
    patient_name: 'bob',
    appointment_timeslot: 3,
  },
];

const appointments = [
  {
    appointment_id: 1000,
    doctor_id: 2,
    patient_id: 100,
  },
  {
    appointment_id: 2000,
    doctor_id: 3,
    patient_id: 200,
  },
];


// Resolvers define how to fetch the types defined in your schema.
const resolvers = {
  Query: {
    //doctors: () => doctors,
    //patients: () => patients,
    //appointments: () => appointments,
    getDoctorDetails: (root, args, context, info) => {
      return doctors.find(({doctor_id}) => doctor_id == args.doctor_id);
    },
    getDoctorSlots: (root, args, context, info) => {
      const doctor =  doctors.find(({doctor_id}) => doctor_id == args.doctor_id)
      console.log({doctor})
      return doctor.available_timeslots;
    }
  },

  Mutation: {
    bookAppointment: (root, args, context, info) => {
      const doctor = doctors.find(({doctor_id}) => doctor_id == args.doctor_id);
      const patient = patients.find(({patient_id}) => patient_id == args.patient_id);
      //const appointment = appointments.find(({appointment_id}) => appointment_id == args.appointment_id)
      const updated_available_timeslots = doctor.available_timeslots.filter((available_timeslot) => available_timeslot != args.appointment_timeslot);
      patient.appointment_timeslot = args.appointment_timeslot;
      return {
        doctor_name: doctor.doctor_name,
        available_timeslots: updated_available_timeslots,
        patient_name: patient.patient_name,
        appointment_timeslot: patient.appointment_timeslot,
      };
    },
    cancelAppointment: (root, args, context, info) => {
      const appointment = appointments.find(({appointment_id}) => appointment_id == args.appointment_id);
      // Steps:
      // 1. Get doctor_id using appointment_id and appointments (This is just appointment.doctor_id).
      // 2. Get patient_id using appointment_id and appointments (This is just appointment.patient_id).
      // 3. Get timeslot_to_be_cancelled using patient_id and patients.
      // 4. Create updated_available_timeslots by adding timeslot_to_be_cancelled to doctor.available_timeslots. 
      // 5. Return doctor_id from 1 and updated_available_timeslots from 4.
      const doctorId = appointment.doctor_id;
      const patientId = appointment.patient_id;
      const patient = patients.find(({patient_id}) => patient_id == patientId);
      const timeslot_to_be_cancelled = patient.appointment_timeslot;
      const doctor = doctors.find(({doctor_id}) => doctor_id == doctorId);
      //const available_timeslots = doctor.available_timeslots;
      doctor.available_timeslots.push(timeslot_to_be_cancelled);
      return {
        doctor_id: doctorId,
        available_timeslots: doctor.available_timeslots,
      };
    },
    updatePatientName: (root, args, context, info) => {
      // Steps:
      // 1. Get patient_id from appointment_id and appointments.
      // 2. Get appointment_timeslot from patient_id and patients.
      // 3. Create new patient with new patient_id, patient_name from arg, and appointment_timeslot from 2.
      // 4. Return 3.
      const appointment = appointments.find(({appointment_id}) => appointment_id == args.appointment_id);
      const patientId = appointment.patient_id;
      const patient = patients.find(({patient_id}) => patient_id == patientId);
      const appointmentTimeslot = patient.appointment_timeslot;

      return {
        patient_id: 300,
        patient_name: args.patient_name,
        appointment_timeslot: appointmentTimeslot,
      };
    }

  }
};


// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);