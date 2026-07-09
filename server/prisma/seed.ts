import { PrismaClient, Speciality, Grade, TimeSlot } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================
// REAL BRAND DATA
// ============================================

const BRANDS = [
  // SITADAY line (Diabetes)
  { name: 'SITADAY-50', category: 'Diabetes' },
  { name: 'SITADAY-100', category: 'Diabetes' },
  { name: 'SITADAY-D5', category: 'Diabetes' },
  { name: 'SITADAY-D10', category: 'Diabetes' },
  { name: 'SITADAY-DM', category: 'Diabetes' },
  { name: 'SITADAY-DM FORTE', category: 'Diabetes' },
  { name: 'SITADAY-GM1', category: 'Diabetes' },
  { name: 'SITADAY-GM1 FORTE', category: 'Diabetes' },
  { name: 'SITADAY-GM2', category: 'Diabetes' },
  { name: 'SITADAY-GM2 FORTE', category: 'Diabetes' },
  { name: 'SITADAY-M 500', category: 'Diabetes' },
  { name: 'SITADAY-M 1000', category: 'Diabetes' },
  { name: 'SITADAY-MXR', category: 'Diabetes' },
  { name: 'SITADAY-PM', category: 'Diabetes' },
  { name: 'SITADAY-PM FORTE', category: 'Diabetes' },
  // VERTISTAR (Vertigo)
  { name: 'VERTISTAR-24 SR', category: 'Vertigo' },
  { name: 'VERTISTAR-48 SR', category: 'Vertigo' },
  { name: 'VERTISTAR-MD 8', category: 'Vertigo' },
  { name: 'VERTISTAR-MD 16', category: 'Vertigo' },
  { name: 'VERTISTAR-MD 24', category: 'Vertigo' },
  // D3 MUST (Vitamin D3)
  { name: 'D3 MUST 2K', category: 'Vitamin D3' },
  { name: 'D3 MUST 60K', category: 'Vitamin D3' },
  { name: 'D3 MUST 60K NANO', category: 'Vitamin D3' },
  { name: 'D3 MUST DROPS', category: 'Vitamin D3' },
  { name: 'D3 MUST FORTE', category: 'Vitamin D3' },
  // CEFAKIND (Antibiotic)
  { name: 'CEFAKIND-CV 250', category: 'Antibiotic' },
  { name: 'CEFAKIND-CV 500', category: 'Antibiotic' },
  // CLARINOVA (Antibiotic)
  { name: 'CLARINOVA-500', category: 'Antibiotic' },
  { name: 'CLARINOVA-250', category: 'Antibiotic' },
  { name: 'CLARINOVA DS 125', category: 'Antibiotic' },
  { name: 'CLARINOVA DS 250', category: 'Antibiotic' },
  // MAHAGABA (Neuro)
  { name: 'MAHAGABA-D', category: 'Neuro' },
  { name: 'MAHAGABA GEL', category: 'Neuro' },
  { name: 'MAHAGABA M-75', category: 'Neuro' },
  { name: 'MAHAGABA-M OD', category: 'Neuro' },
  { name: 'MAHAGABA-NT 75', category: 'Neuro' },
  // GLIMESTAR (Diabetes)
  { name: 'GLIMESTAR MV1', category: 'Diabetes' },
  { name: 'GLIMESTAR MV2', category: 'Diabetes' },
  // Others
  { name: 'NEUROKIND Z MORE', category: 'Neuro Supplement' },
  { name: 'AMLOKIND BETA 25', category: 'Cardiac' },
  { name: 'AMLOKIND BETA 50', category: 'Cardiac' },
  // TELMIKIND (Cardiac)
  { name: 'TELMIKIND-CT 40/12.5', category: 'Cardiac' },
  { name: 'TELMIKIND-CT 40/6.25', category: 'Cardiac' },
  { name: 'TELMIKIND-CT 80/12.5', category: 'Cardiac' },
  { name: 'TELMIKIND-LN 40/10', category: 'Cardiac' },
  { name: 'TELMIKIND-LN 40/20', category: 'Cardiac' },
  { name: 'TELMIKIND-LN 80/10', category: 'Cardiac' },
  { name: 'TELMIKIND LNB-25', category: 'Cardiac' },
  { name: 'TELMIKIND LNB-50', category: 'Cardiac' },
  // LIZOFORCE (Antibiotic)
  { name: 'LIZOFORCE CAPSULES', category: 'Antibiotic' },
  { name: 'LIZOFORCE IV', category: 'Antibiotic' },
  { name: 'LIZOFORCE DRY SYRUP', category: 'Antibiotic' },
  // OVERZYME (Digestive)
  { name: 'OVERZYME 10K', category: 'Digestive' },
  { name: 'OVERZYME 25K', category: 'Digestive' },
  { name: 'OVERZYME SYRUP', category: 'Digestive' },
  // Others
  { name: 'ORTHOBOON', category: 'Orthopedic' },
  { name: 'POLAMAFORCE', category: 'General' },
];

// ============================================
// REAL DOCTOR DATA - Tirupati Region
// ============================================

interface DoctorSeed {
  name: string;
  speciality: Speciality;
  grade: Grade;
  area: string;
  notes?: string;
}

const doctors: DoctorSeed[] = [
  // PEDIATRICIAN (17)
  { name: 'Dr. Anjan Kumar V.S', speciality: 'PEDIATRICIAN', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. K Jaya Shankar', speciality: 'PEDIATRICIAN', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. B Venkateswara Reddy', speciality: 'PEDIATRICIAN', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. J Muni Shekar', speciality: 'PEDIATRICIAN', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. K Venkat Raman', speciality: 'PEDIATRICIAN', grade: 'A', area: 'Kalahasti' },
  { name: 'Dr. L Raja Shekar Reddy', speciality: 'PEDIATRICIAN', grade: 'B', area: 'Kalahasti' },
  { name: 'Dr. K Ram Mohan', speciality: 'PEDIATRICIAN', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. A Karthikeyan', speciality: 'PEDIATRICIAN', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. Naga Sai Manoj', speciality: 'PEDIATRICIAN', grade: 'C', area: 'Tirupati' },
  { name: 'Dr. Manohar B', speciality: 'PEDIATRICIAN', grade: 'C', area: 'Tirupati' },
  { name: 'Dr. K C Chaithanya Yadav', speciality: 'PEDIATRICIAN', grade: 'C', area: 'Kalahasti' },
  { name: 'Dr. Ravi Kumar', speciality: 'PEDIATRICIAN', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. A S Keerthi', speciality: 'PEDIATRICIAN', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. M Lalitha', speciality: 'PEDIATRICIAN', grade: 'C', area: 'Kalahasti' },
  { name: 'Dr. M Pallavi', speciality: 'PEDIATRICIAN', grade: 'C', area: 'Kalahasti' },
  { name: 'Dr. V Niharika', speciality: 'PEDIATRICIAN', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. G Madhu Babu', speciality: 'PEDIATRICIAN', grade: 'C', area: 'Chandragiri' },
  // CARDIOLOGIST (6)
  { name: 'Dr. Vasu Deva Shetty', speciality: 'CARDIOLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. P Chandra Sekhar Reddy', speciality: 'CARDIOLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. V M Vikash', speciality: 'CARDIOLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. Vivek Chaithanya', speciality: 'CARDIOLOGIST', grade: 'B', area: 'Kalahasti' },
  { name: 'Dr. B Sree Lalitha', speciality: 'CARDIOLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. P Sumanth Reddy', speciality: 'CARDIOLOGIST', grade: 'B', area: 'Tirupati' },
  // DIABETOLOGIST (14)
  { name: 'Dr. B Giri Prasad', speciality: 'DIABETOLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. D Sree Vani', speciality: 'DIABETOLOGIST', grade: 'B', area: 'Kalahasti' },
  { name: 'Dr. C Hanumantha Rao', speciality: 'DIABETOLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. Rajesh K Reddy', speciality: 'DIABETOLOGIST', grade: 'B', area: 'Kalahasti' },
  { name: 'Dr. S Ravi Babu', speciality: 'DIABETOLOGIST', grade: 'B', area: 'Kalahasti' },
  { name: 'Dr. A Sateesh', speciality: 'DIABETOLOGIST', grade: 'C', area: 'Kalahasti' },
  { name: 'Dr. S Savitha', speciality: 'DIABETOLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. B Krishna Chaithanya Reddy', speciality: 'DIABETOLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. K Chakra Pani', speciality: 'DIABETOLOGIST', grade: 'C', area: 'Kalahasti' },
  { name: 'Dr. Kondeti Madhavi', speciality: 'DIABETOLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. P S Naidu', speciality: 'DIABETOLOGIST', grade: 'C', area: 'Tirupati' },
  { name: 'Dr. Kalyan', speciality: 'DIABETOLOGIST', grade: 'C', area: 'Tirupati' },
  { name: 'Dr. Chandra Sekhar Reddy', speciality: 'DIABETOLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. Premchand Y', speciality: 'DIABETOLOGIST', grade: 'C', area: 'Kalahasti' },
  // NEUROLOGIST (10)
  { name: 'Dr. Niranjan Babu', speciality: 'NEUROLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. A Yamini', speciality: 'NEUROLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. M Jaya Prakash', speciality: 'NEUROLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. A S Keerthi (Neuro)', speciality: 'NEUROLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. Raghu Nandini', speciality: 'NEUROLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. Satish Gundla', speciality: 'NEUROLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. Phani Kumar', speciality: 'NEUROLOGIST', grade: 'C', area: 'Tirupati' },
  { name: 'Dr. Ravi Prakash', speciality: 'NEUROLOGIST', grade: 'C', area: 'Tirupati' },
  { name: 'Dr. Ganta Rajasekhar', speciality: 'NEUROLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. C Ravi Sekhar Reddy', speciality: 'NEUROLOGIST', grade: 'A', area: 'Tirupati' },
  // ENT (6)
  { name: 'Dr. S Sukumar', speciality: 'ENT', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. B Harinath', speciality: 'ENT', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. Kiran (ENT)', speciality: 'ENT', grade: 'B', area: 'Kalahasti' },
  { name: 'Dr. G B Sreenivas', speciality: 'ENT', grade: 'B', area: 'Kalahasti' },
  { name: 'Dr. Purushotham', speciality: 'ENT', grade: 'C', area: 'Kalahasti' },
  { name: 'Dr. K Divya Rana', speciality: 'ENT', grade: 'B', area: 'Tirupati' },
  // ENDOCRINOLOGIST (10)
  { name: 'Dr. B P Verma', speciality: 'ENDOCRINOLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. Y Rajesh Reddy', speciality: 'ENDOCRINOLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. V Geerthana', speciality: 'ENDOCRINOLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. M Bhavana', speciality: 'ENDOCRINOLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. M Keethana', speciality: 'ENDOCRINOLOGIST', grade: 'C', area: 'Tirupati' },
  { name: 'Dr. Allock Sachin', speciality: 'ENDOCRINOLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. B Krunal Pravinchandra', speciality: 'ENDOCRINOLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. Venkatesh', speciality: 'ENDOCRINOLOGIST', grade: 'C', area: 'Tirupati' },
  { name: 'Dr. B Likhitha', speciality: 'ENDOCRINOLOGIST', grade: 'C', area: 'Tirupati' },
  { name: 'Dr. Sai Krishna Chaithanya P', speciality: 'ENDOCRINOLOGIST', grade: 'B', area: 'Tirupati' },
  // ORTHOPEDIC (16)
  { name: 'Dr. M Maruthi Krishna', speciality: 'ORTHOPEDIC', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. A Indra Sai Vamsi', speciality: 'ORTHOPEDIC', grade: 'B', area: 'Kalahasti' },
  { name: 'Dr. G Uma Maheshwara Reddy', speciality: 'ORTHOPEDIC', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. B Hema Kumar Reddy', speciality: 'ORTHOPEDIC', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. Kiran Kumar G P', speciality: 'ORTHOPEDIC', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. P Kalyan Chakravarthy', speciality: 'ORTHOPEDIC', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. M Rajesh', speciality: 'ORTHOPEDIC', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. B Obul Pathy', speciality: 'ORTHOPEDIC', grade: 'C', area: 'Tirupati' },
  { name: 'Dr. Venkat (Ortho)', speciality: 'ORTHOPEDIC', grade: 'C', area: 'Tirupati' },
  { name: 'Dr. K Venkateshwara Reddy', speciality: 'ORTHOPEDIC', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. Poorna Chandra Rao', speciality: 'ORTHOPEDIC', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. Sunandana Kumar Reddy', speciality: 'ORTHOPEDIC', grade: 'C', area: 'Tirupati' },
  { name: 'Dr. T Manideep', speciality: 'ORTHOPEDIC', grade: 'C', area: 'Kalahasti' },
  { name: 'Dr. Venu Gopal', speciality: 'ORTHOPEDIC', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. P Prashanth Kumar', speciality: 'ORTHOPEDIC', grade: 'C', area: 'Tirupati' },
  { name: 'Dr. Pasupuleti Hari Prasad', speciality: 'ORTHOPEDIC', grade: 'B', area: 'Tirupati' },
  // GYNECOLOGIST (10)
  { name: 'Dr. Partha Saradi Reddy', speciality: 'GYNECOLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. Usha Sree', speciality: 'GYNECOLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. C Manju Yadav', speciality: 'GYNECOLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. K Neelima', speciality: 'GYNECOLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. C Vidya Vathi', speciality: 'GYNECOLOGIST', grade: 'B', area: 'Kalahasti' },
  { name: 'Dr. B Bhargavi Reddy', speciality: 'GYNECOLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. B Gayathri', speciality: 'GYNECOLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. Manikarnika', speciality: 'GYNECOLOGIST', grade: 'C', area: 'Tirupati' },
  { name: 'Dr. B Haritha', speciality: 'GYNECOLOGIST', grade: 'C', area: 'Kalahasti' },
  { name: 'Dr. K Ramya', speciality: 'GYNECOLOGIST', grade: 'C', area: 'Kalahasti' },
  // SURGEON → CONSULTING_PHYSICIAN (15)
  { name: 'Dr. Adepa', speciality: 'CONSULTING_PHYSICIAN', grade: 'A', area: 'Tirupati', notes: 'Surgeon' },
  { name: 'Dr. Chakaradhar', speciality: 'CONSULTING_PHYSICIAN', grade: 'A', area: 'Tirupati', notes: 'Surgeon' },
  { name: 'Dr. T G Dinesh Krishna', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Surgeon' },
  { name: 'Dr. Balarama Raju S', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Surgeon' },
  { name: 'Dr. P Teja', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Surgeon' },
  { name: 'Dr. Y Prasad Naidu', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Kalahasti', notes: 'Surgeon' },
  { name: 'Dr. P Hema Bindhu', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Kalahasti', notes: 'Surgeon' },
  { name: 'Dr. K Prasanth', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Surgeon' },
  { name: 'Dr. K Keerthi Mayee', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Tirupati', notes: 'Surgeon' },
  { name: 'Dr. M A Hari Babu', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Surgeon' },
  { name: 'Dr. C Siva Kishore Yadav', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Tirupati', notes: 'Surgeon' },
  { name: 'Dr. Ranadheer Raju C S', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Surgeon' },
  { name: 'Dr. S V Prasad', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Surgeon' },
  { name: 'Dr. M S Sreedhar', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Tirupati', notes: 'Surgeon' },
  { name: 'Dr. G Praveen Chandra', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Kalahasti', notes: 'Surgeon' },
  // PHYSICIAN → CONSULTING_PHYSICIAN (16)
  { name: 'Dr. E V Ramana', speciality: 'CONSULTING_PHYSICIAN', grade: 'A', area: 'Tirupati', notes: 'Physician' },
  { name: 'Dr. Janardhan', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Kalahasti', notes: 'Physician' },
  { name: 'Dr. Mohan', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Kalahasti', notes: 'Physician' },
  { name: 'Dr. Sreenath', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Rompicherla', notes: 'Physician' },
  { name: 'Dr. P Damodaram', speciality: 'CONSULTING_PHYSICIAN', grade: 'A', area: 'Tirupati', notes: 'Physician' },
  { name: 'Dr. P Sudheer Kumar', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Physician' },
  { name: 'Dr. E Kiran Kumar', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Kalahasti', notes: 'Physician' },
  { name: 'Dr. Rama Devi', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Physician' },
  { name: 'Dr. Padmanabha Reddy', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Tirupati', notes: 'Physician' },
  { name: 'Dr. A Annesh', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Tirupati', notes: 'Physician' },
  { name: 'Dr. V Gangi Reddy', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Tirupati', notes: 'Physician' },
  { name: 'Dr. Keerthi (Physician)', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Tirupati', notes: 'Physician' },
  { name: 'Dr. K Saraswathi', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Kalahasti', notes: 'Physician' },
  { name: 'Dr. K Raghava Reddy', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Kalahasti', notes: 'Physician' },
  { name: 'Dr. Bhathaiha Naidu', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Kalahasti', notes: 'Physician' },
  { name: 'Dr. A Sandhya Rani', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Kalahasti', notes: 'Physician' },
  // CHEST PHYSICIAN (8)
  { name: 'Dr. S V Subbarao', speciality: 'CONSULTING_PHYSICIAN', grade: 'A', area: 'Tirupati', notes: 'Chest Physician' },
  { name: 'Dr. Murali Babu', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Kalahasti', notes: 'Chest Physician' },
  { name: 'Dr. K Sai Vikas Reddy', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Chest Physician' },
  { name: 'Dr. Abhinaya Durga', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Tirupati', notes: 'Chest Physician' },
  { name: 'Dr. S P Anusha Reddy', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Kalahasti', notes: 'Chest Physician' },
  { name: 'Dr. G Chandra Sekhar', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Kalahasti', notes: 'Chest Physician' },
  { name: 'Dr. Anupama V', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Chest Physician' },
  { name: 'Dr. K Siva Prasad', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Tirupati', notes: 'Chest Physician' },
  // GP → GENERAL_PHYSICIAN (33)
  { name: 'Dr. G Gnanamba', speciality: 'GENERAL_PHYSICIAN', grade: 'B', area: 'Kalahasti' },
  { name: 'Dr. O Lakshmi Narayana', speciality: 'GENERAL_PHYSICIAN', grade: 'B', area: 'Rompicherla' },
  { name: 'Dr. Chalapathi Raju', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Puli Cherla' },
  { name: 'Dr. T Suresh Reddy', speciality: 'GENERAL_PHYSICIAN', grade: 'B', area: 'Kalahasti' },
  { name: 'Dr. E Balaji', speciality: 'GENERAL_PHYSICIAN', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. Hari Prasad (GP)', speciality: 'GENERAL_PHYSICIAN', grade: 'B', area: 'Chandragiri' },
  { name: 'Dr. George Muller', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Pachika Palam' },
  { name: 'Dr. S Prasad Naidu', speciality: 'GENERAL_PHYSICIAN', grade: 'B', area: 'Kalahasti' },
  { name: 'Dr. Muni Swamy', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Kalahasti' },
  { name: 'Dr. V Manoj Kumar', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Kalahasti' },
  { name: 'Dr. R Ramana Reddy', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Sadum' },
  { name: 'Dr. Eswar Reddy', speciality: 'GENERAL_PHYSICIAN', grade: 'B', area: 'Pakala' },
  { name: 'Dr. Brahmananda Reddy', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Pachika Palam' },
  { name: 'Dr. Ali Ahmed', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Chandragiri' },
  { name: 'Dr. K V Surya Narayana', speciality: 'GENERAL_PHYSICIAN', grade: 'B', area: 'Kalahasti' },
  { name: 'Dr. D Dharneeshwara Reddy', speciality: 'GENERAL_PHYSICIAN', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. Shankar Reddy', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Pakala' },
  { name: 'Dr. Kumar Raja T', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Pachika Palam' },
  { name: 'Dr. V Ramana Reddy', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Kalahasti' },
  { name: 'Dr. Devarajulu', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Veduru Kuppam' },
  { name: 'Dr. Dhana Lakshmi', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Pachika Palam' },
  { name: 'Dr. Jayanth Babu', speciality: 'GENERAL_PHYSICIAN', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. Nagoor', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Veduru Kuppam' },
  { name: 'Dr. V Pradeep Reddy', speciality: 'GENERAL_PHYSICIAN', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. Ramesh Babu', speciality: 'GENERAL_PHYSICIAN', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. Mallikarjuna Reddy', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Kalur' },
  { name: 'Dr. Siddayya', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Chandragiri' },
  { name: 'Dr. Srinivasulu K', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Mangalam Peta' },
  { name: 'Dr. Ramurthy Naidu', speciality: 'GENERAL_PHYSICIAN', grade: 'B', area: 'Pakala' },
  { name: 'Dr. Bhanu Prakash Reddy', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Sadum' },
  { name: 'Dr. Surendra', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Rangampeta' },
  { name: 'Dr. P Vijay Srinivas', speciality: 'GENERAL_PHYSICIAN', grade: 'B', area: 'Pakala' },
  { name: 'Dr. Joshna C B', speciality: 'GENERAL_PHYSICIAN', grade: 'C', area: 'Pakala' },
  // CONSULTANT (10)
  { name: 'Dr. Lokesh Padiri', speciality: 'CONSULTING_PHYSICIAN', grade: 'A', area: 'Kalahasti', notes: 'Consultant' },
  { name: 'Dr. Haneesha M', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Consultant' },
  { name: 'Dr. Mallem Babu', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Consultant' },
  { name: 'Dr. K Hema Priya', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Consultant' },
  { name: 'Dr. J Bharath', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Kalahasti', notes: 'Consultant' },
  { name: 'Dr. Shankar Naren L', speciality: 'CONSULTING_PHYSICIAN', grade: 'A', area: 'Tirupati', notes: 'Consultant' },
  { name: 'Dr. Anupama (Consultant)', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Kalahasti', notes: 'Consultant' },
  { name: 'Dr. Spandana', speciality: 'CONSULTING_PHYSICIAN', grade: 'C', area: 'Tirupati', notes: 'Consultant' },
  { name: 'Dr. Vishnu Anjan Naren Reddy', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Consultant' },
  { name: 'Dr. Karthik Reddy', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Consultant' },
  // GASTROENTEROLOGIST (5)
  { name: 'Dr. Anwar Basha', speciality: 'GASTROENTEROLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. K Mahendra Reddy', speciality: 'GASTROENTEROLOGIST', grade: 'A', area: 'Tirupati' },
  { name: 'Dr. G Siva Rama Krishna', speciality: 'GASTROENTEROLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. K Venkat Ramana Reddy', speciality: 'GASTROENTEROLOGIST', grade: 'B', area: 'Tirupati' },
  { name: 'Dr. C Satish Chandra Reddy', speciality: 'GASTROENTEROLOGIST', grade: 'B', area: 'Tirupati' },
  // PULMONOLOGIST (2)
  { name: 'Dr. Murali Babu (Pulm)', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Kalahasti', notes: 'Pulmonologist' },
  { name: 'Dr. Vikash Mancheti', speciality: 'CONSULTING_PHYSICIAN', grade: 'B', area: 'Tirupati', notes: 'Pulmonologist' },
];

const areaConfigs = [
  { name: 'Tirupati', color: '#3B82F6', description: 'Main city - temple town' },
  { name: 'Kalahasti', color: '#10B981', description: 'Sri Kalahasti - nearby town' },
  { name: 'Chandragiri', color: '#F59E0B', description: 'Chandragiri fort area' },
  { name: 'Pakala', color: '#EF4444', description: 'Pakala junction town' },
  { name: 'Rompicherla', color: '#8B5CF6', description: 'Rompicherla village' },
  { name: 'Pachika Palam', color: '#EC4899', description: 'Pachika Palam area' },
  { name: 'Puli Cherla', color: '#06B6D4', description: 'Puli Cherla village' },
  { name: 'Sadum', color: '#84CC16', description: 'Sadum area' },
  { name: 'Veduru Kuppam', color: '#F97316', description: 'Veduru Kuppam village' },
  { name: 'Kalur', color: '#14B8A6', description: 'Kalur area' },
  { name: 'Mangalam Peta', color: '#A855F7', description: 'Mangalam Peta village' },
  { name: 'Rangampeta', color: '#F43F5E', description: 'Rangampeta area' },
];

// ============================================
// SEED FUNCTION
// ============================================

async function main() {
  console.log('🌱 Seeding database...');

  // Clean
  console.log('🧹 Cleaning...');
  await prisma.visit.deleteMany();
  await prisma.planItem.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.chemist.deleteMany();
  await prisma.beat.deleteMany();
  await prisma.area.deleteMany();
  await prisma.brand.deleteMany();
  console.log('✅ Cleaned');

  // User
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
  const user = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@medrep.local' },
    update: {},
    create: {
      name: process.env.ADMIN_NAME || 'Medical Rep',
      email: process.env.ADMIN_EMAIL || 'admin@medrep.local',
      passwordHash,
    },
  });
  console.log(`✅ User: ${user.email}`);

  // Brands
  for (let i = 0; i < BRANDS.length; i++) {
    await prisma.brand.create({
      data: { name: BRANDS[i].name, category: BRANDS[i].category, sortOrder: i },
    });
  }
  console.log(`✅ ${BRANDS.length} brands created`);

  // Areas
  const areaMap = new Map<string, string>();
  for (const cfg of areaConfigs) {
    const area = await prisma.area.create({
      data: { name: cfg.name, description: cfg.description, color: cfg.color },
    });
    areaMap.set(cfg.name, area.id);
  }
  console.log(`✅ ${areaMap.size} areas`);

  // Beats
  const beatConfigs = [
    { name: 'Tirupati Town', areaName: 'Tirupati', dayOfWeek: 1 },
    { name: 'Tirupati Rural', areaName: 'Tirupati', dayOfWeek: 4 },
    { name: 'Kalahasti Town', areaName: 'Kalahasti', dayOfWeek: 2 },
    { name: 'Kalahasti Outskirts', areaName: 'Kalahasti', dayOfWeek: 5 },
    { name: 'Chandragiri Beat', areaName: 'Chandragiri', dayOfWeek: 3 },
    { name: 'Pakala Beat', areaName: 'Pakala', dayOfWeek: 6 },
    { name: 'Rompicherla Beat', areaName: 'Rompicherla', dayOfWeek: 3 },
    { name: 'Pachika Palam Beat', areaName: 'Pachika Palam', dayOfWeek: 4 },
  ];
  const beatMap = new Map<string, string>();
  for (const b of beatConfigs) {
    const areaId = areaMap.get(b.areaName)!;
    const beat = await prisma.beat.create({
      data: { name: b.name, areaId, dayOfWeek: b.dayOfWeek },
    });
    beatMap.set(b.areaName, beat.id);
  }
  console.log(`✅ ${beatConfigs.length} beats`);

  // Chemists
  const chemistData = [
    { name: 'Sri Venkateswara Medicals', pharmacyName: 'SV Medicals', areaName: 'Tirupati' },
    { name: 'Apollo Pharmacy Tirupati', pharmacyName: 'Apollo Pharmacy', areaName: 'Tirupati' },
    { name: 'MedPlus Kalahasti', pharmacyName: 'MedPlus', areaName: 'Kalahasti' },
    { name: 'Sri Balaji Pharma', pharmacyName: 'Balaji Pharmacy', areaName: 'Kalahasti' },
    { name: 'Srinivasa Medicals', pharmacyName: 'Srinivasa Medicals', areaName: 'Chandragiri' },
    { name: 'Lakshmi Medicals', pharmacyName: 'Lakshmi Medicals', areaName: 'Pakala' },
  ];
  for (const c of chemistData) {
    await prisma.chemist.create({
      data: { name: c.name, pharmacyName: c.pharmacyName, areaId: areaMap.get(c.areaName) },
    });
  }
  console.log(`✅ ${chemistData.length} chemists`);

  // Doctors
  const prefDayOptions = [[1,3,5],[2,4,6],[1,2,3,4,5],[1,4],[2,5],[3,6]];
  const timeSlots: (TimeSlot | undefined)[] = ['MORNING','AFTERNOON','EVENING', undefined];
  const mSlots = [{ s:'09:00',e:'12:00' },{ s:'09:30',e:'12:30' },{ s:'10:00',e:'13:00' },{ s:'08:30',e:'11:30' }];
  const aSlots = [{ s:'14:00',e:'17:00' },{ s:'14:30',e:'17:30' },{ s:'15:00',e:'18:00' },{ s:'13:00',e:'16:00' }];
  const eSlots = [{ s:'17:00',e:'20:00' },{ s:'18:00',e:'21:00' },{ s:'17:30',e:'20:30' },{ s:'16:00',e:'19:00' }];

  let doctorCount = 0;
  for (let i = 0; i < doctors.length; i++) {
    const doc = doctors[i];
    const vf = doc.grade === 'A' ? 3 : doc.grade === 'B' ? 2 : 1;
    const morning = i % 3 !== 2 ? mSlots[i % mSlots.length] : undefined;
    const afternoon = i % 3 !== 0 ? aSlots[i % aSlots.length] : undefined;
    const evening = i % 4 === 0 ? eSlots[i % eSlots.length] : undefined;

    await prisma.doctor.create({
      data: {
        name: doc.name,
        speciality: doc.speciality,
        grade: doc.grade,
        areaId: areaMap.get(doc.area),
        beatId: beatMap.get(doc.area),
        address: `${doc.area}, Andhra Pradesh`,
        morningStart: morning?.s,
        morningEnd: morning?.e,
        afternoonStart: afternoon?.s,
        afternoonEnd: afternoon?.e,
        eveningStart: evening?.s,
        eveningEnd: evening?.e,
        preferredDays: prefDayOptions[i % prefDayOptions.length],
        preferredTime: timeSlots[i % timeSlots.length],
        exStationDays: i % 7 === 0 ? [0] : [],
        priority: doc.grade === 'A' ? (1 + i % 3) : doc.grade === 'B' ? (4 + i % 3) : (7 + i % 3),
        favorite: doc.grade === 'A' && i % 3 === 0,
        visitFrequency: vf,
        notes: doc.notes,
      },
    });
    doctorCount++;
  }
  console.log(`✅ ${doctorCount} doctors`);

  // Visits with brand data
  const allDoctors = await prisma.doctor.findMany({ select: { id: true, speciality: true } });
  const brandNames = BRANDS.map(b => b.name);

  // Brands by speciality relevance
  const specialityBrands: Record<string, string[]> = {
    DIABETOLOGIST: brandNames.filter(b => b.startsWith('SITADAY') || b.startsWith('GLIMESTAR')),
    CARDIOLOGIST: brandNames.filter(b => b.startsWith('TELMIKIND') || b.startsWith('AMLOKIND')),
    NEUROLOGIST: brandNames.filter(b => b.startsWith('MAHAGABA') || b.startsWith('VERTISTAR') || b === 'NEUROKIND Z MORE'),
    ORTHOPEDIC: ['ORTHOBOON', 'D3 MUST 60K', 'D3 MUST 2K', 'D3 MUST FORTE', 'MAHAGABA-D'],
    ENT: brandNames.filter(b => b.startsWith('CLARINOVA') || b.startsWith('CEFAKIND')),
    GASTROENTEROLOGIST: brandNames.filter(b => b.startsWith('OVERZYME')),
    PEDIATRICIAN: ['D3 MUST DROPS', 'CEFAKIND-CV 250', 'CLARINOVA DS 125', 'CLARINOVA DS 250', 'OVERZYME SYRUP'],
    ENDOCRINOLOGIST: brandNames.filter(b => b.startsWith('SITADAY') || b.startsWith('D3 MUST')),
  };

  const feedbackOptions = [
    'Will prescribe for next 10 patients',
    'Good results with previous samples',
    'Wants more clinical data',
    'Already writing our brand',
    'Competitive brand preferred, needs convincing',
    'Positive feedback on formulation',
    'Requested samples',
    'Doctor was busy, met assistant',
    'Detailed discussion on efficacy',
    'Compared with competitor, impressed',
  ];

  let visitCount = 0;
  for (let day = 1; day <= 21; day++) {
    const d = new Date();
    d.setDate(d.getDate() - day);
    d.setHours(10 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60), 0, 0);
    const numVisits = 5 + Math.floor(Math.random() * 6);
    const shuffled = [...allDoctors].sort(() => Math.random() - 0.5).slice(0, numVisits);

    for (const doc of shuffled) {
      const relevantBrands = specialityBrands[doc.speciality] || brandNames.slice(0, 10);
      const promoted = relevantBrands.sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
      const written = Math.random() > 0.4 ? promoted.slice(0, 1 + Math.floor(Math.random() * 2)) : [];

      await prisma.visit.create({
        data: {
          doctorId: doc.id,
          visitDate: d,
          completed: Math.random() > 0.15,
          skipped: Math.random() < 0.1,
          products: promoted, // Legacy
          brandsPromoted: promoted,
          brandsWritten: written,
          doctorFeedback: Math.random() > 0.3 ? feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)] : undefined,
          rxCommitment: Math.random() > 0.5 ? 5 + Math.floor(Math.random() * 20) : undefined,
          followUpBrand: Math.random() > 0.6 ? promoted[0] : undefined,
          remarks: feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)],
          duration: 10 + Math.floor(Math.random() * 25),
          followUpDate: Math.random() > 0.7 ? new Date(d.getTime() + 7 * 86400000) : undefined,
        },
      });
      visitCount++;
    }
  }
  console.log(`✅ ${visitCount} visits`);

  console.log('\n🎉 Seeded!');
  console.log(`   👤 ${user.email} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  console.log(`   🏥 ${doctorCount} doctors | 📍 ${areaMap.size} areas | 💊 ${BRANDS.length} brands | 📝 ${visitCount} visits`);
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
