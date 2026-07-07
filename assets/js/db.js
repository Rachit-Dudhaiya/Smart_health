/**
 * Smart Health - Simulated LocalStorage Database Layer
 */

const DB_KEYS = {
    USERS: 'sh_users',
    MEDICINES: 'sh_medicines',
    BEDS: 'sh_beds',
    ATTENDANCE: 'sh_attendance',
    PATIENT_FLOW: 'sh_patient_flow',
    NOTIFICATIONS: 'sh_notifications',
    FEEDBACK: 'sh_feedback',
    PAGE_CONTENTS: 'sh_page_contents',
    ACTIVITY_LOGS: 'sh_activity_logs',
    CURRENT_USER: 'sh_current_user',
    GALLERY: 'sh_gallery',
    APPOINTMENTS: 'sh_appointments',
    DOCTOR_AVAILABILITY: 'sh_doctor_availability',
    BILLS: 'sh_bills',
    AMBULANCES: 'sh_ambulances',
    AMBULANCE_REQUESTS: 'sh_ambulance_requests'
};

const validate = {
    email(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    },
    password(password) {
        return typeof password === 'string' && password.length >= 8;
    },
    required(val) {
        if (typeof val === 'string') {
            return val.trim().length > 0;
        }
        return val !== null && val !== undefined;
    },
    integer(val, min = 0) {
        const parsed = Number(val);
        return Number.isInteger(parsed) && parsed >= min;
    },
    date(dateStr) {
        const timestamp = Date.parse(dateStr);
        return !isNaN(timestamp);
    }
};

const db = {
    // Initialize DB with seed data if empty
    init() {
        // 1. Users
        if (!localStorage.getItem(DB_KEYS.USERS) || JSON.parse(localStorage.getItem(DB_KEYS.USERS)).length === 0) {
            const seedUsers = [
                { id: 1, name: 'System Admin', email: 'admin@smarthealth.com', password: 'password123', role: 'admin', status: 'active', profile_photo: '' },
                { id: 2, name: 'Sunita Sharma', email: 'doctor@smarthealth.com', password: 'password123', role: 'doctor', specialty: 'Cardiology', status: 'active', profile_photo: '' },
                { id: 3, name: 'Rahul Verma', email: 'pharmacist@smarthealth.com', password: 'password123', role: 'pharmacist', status: 'active', profile_photo: '' },
                { id: 4, name: 'RAchit', email: 'patient@smarthealth.com', password: 'password123', role: 'patient', status: 'active', profile_photo: '' }
            ];
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(seedUsers));
        }

        // 2. Bed Inventory
        if (!localStorage.getItem(DB_KEYS.BEDS)) {
            const seedBeds = [
                { id: 1, ward_type: 'ICU', total: 10, occupied: 8 },
                { id: 2, ward_type: 'General', total: 30, occupied: 14 },
                { id: 3, ward_type: 'Pediatric', total: 15, occupied: 7 },
                { id: 4, ward_type: 'Emergency', total: 8, occupied: 6 }
            ];
            localStorage.setItem(DB_KEYS.BEDS, JSON.stringify(seedBeds));
        }

        // 3. Medicine Stock
        if (!localStorage.getItem(DB_KEYS.MEDICINES)) {
            // Setup some dates relative to now
            const getFutureDate = (months) => {
                const d = new Date();
                d.setMonth(d.getMonth() + months);
                return d.toISOString().split('T')[0];
            };
            const getPastDate = (days) => {
                const d = new Date();
                d.setDate(d.getDate() - days);
                return d.toISOString().split('T')[0];
            };

            const seedMedicines = [
                { id: 1, name: 'Paracetamol 650mg', stock: 120, threshold: 20, expiry_date: getFutureDate(6), status: 'normal' },
                { id: 2, name: 'ORS Packets', stock: 80, threshold: 15, expiry_date: getFutureDate(12), status: 'normal' },
                { id: 3, name: 'Insulin Glargine', stock: 15, threshold: 25, expiry_date: getFutureDate(3), status: 'critical' },
                { id: 4, name: 'Amoxicillin 500mg', stock: 45, threshold: 10, expiry_date: getFutureDate(9), status: 'normal' },
                { id: 5, name: 'Metformin 500mg', stock: 8, threshold: 15, expiry_date: getFutureDate(1), status: 'low' },
                { id: 6, name: 'Cough Syrup 100ml', stock: 50, threshold: 10, expiry_date: getPastDate(5), status: 'expired' }
            ];
            localStorage.setItem(DB_KEYS.MEDICINES, JSON.stringify(seedMedicines));
        }

        // 4. Page Contents (CMS)
        if (!localStorage.getItem(DB_KEYS.PAGE_CONTENTS)) {
            const seedContents = [
                {
                    slug: 'about',
                    title: 'About Smart Health',
                    content: 'Smart Health is a state-of-the-art AI-powered Primary Healthcare (PHC) & Community Healthcare (CHC) management system. Our mission is to digitize healthcare facilities in rural and urban spaces, streamlining access to patient data, medicine inventory, doctor attendance, and critical ward beds. By integrating prediction analytics, we assist local administrators in preventing stock-outs and managing peak queues with ease.'
                },
                {
                    slug: 'services',
                    title: 'Our Core Digital Care Services',
                    content: 'We offer five key operational services designed for clinical efficiency: 1. Live Medicine Stock Monitoring to maintain critical supply, 2. Dynamic Bed Occupancy tracking for emergency referrals, 3. Patient Flow analytics to decrease emergency wait times, 4. Secure digital doctor attendance rosters, and 5. Rapid Emergency SOS responses connecting patients directly with ambulance services.'
                }
            ];
            localStorage.setItem(DB_KEYS.PAGE_CONTENTS, JSON.stringify(seedContents));
        }

        // 5. Patient Flow (empty or simple structure)
        if (!localStorage.getItem(DB_KEYS.PATIENT_FLOW)) {
            localStorage.setItem(DB_KEYS.PATIENT_FLOW, JSON.stringify([]));
        }

        // 6. Doctor Attendance
        if (!localStorage.getItem(DB_KEYS.ATTENDANCE)) {
            localStorage.setItem(DB_KEYS.ATTENDANCE, JSON.stringify([]));
        }

        // 7. Notifications
        if (!localStorage.getItem(DB_KEYS.NOTIFICATIONS)) {
            const seedNotifs = [
                { id: 1, user_id: 1, message: "Welcome to Smart Health Command Hub. Setup complete.", is_read: false, created_at: new Date().toISOString() },
                { id: 2, user_id: 2, message: "Attendance roster for today is now live.", is_read: false, created_at: new Date().toISOString() },
                { id: 3, user_id: 3, message: "Insulin Glargine stock has fallen below threshold limit.", is_read: false, created_at: new Date().toISOString() },
                { id: 4, user_id: 4, message: "Your profile has been created successfully.", is_read: false, created_at: new Date().toISOString() }
            ];
            localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(seedNotifs));
        }

        // 8. Activity Logs
        if (!localStorage.getItem(DB_KEYS.ACTIVITY_LOGS)) {
            localStorage.setItem(DB_KEYS.ACTIVITY_LOGS, JSON.stringify([]));
        }

        // 9. Contact Feedback
        if (!localStorage.getItem(DB_KEYS.FEEDBACK)) {
            localStorage.setItem(DB_KEYS.FEEDBACK, JSON.stringify([]));
        }

        // 10. Gallery
        if (!localStorage.getItem(DB_KEYS.GALLERY)) {
            localStorage.setItem(DB_KEYS.GALLERY, JSON.stringify([]));
        }

        // 11. Appointments
        if (!localStorage.getItem(DB_KEYS.APPOINTMENTS)) {
            const seedAppointments = [
                { id: 1, patient_id: 4, doctor_id: 2, appointment_date: new Date().toISOString().split('T')[0], time_slot: '10:00 AM', status: 'approved', symptoms: 'Regular cardiology follow-up' }
            ];
            localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(seedAppointments));
        }

        // 12. Doctor Availability
        if (!localStorage.getItem(DB_KEYS.DOCTOR_AVAILABILITY)) {
            const seedAvailability = [
                { id: 1, doctor_id: 2, available_date: new Date().toISOString().split('T')[0], start_time: '09:00', end_time: '13:00', status: 'available' },
                { id: 2, doctor_id: 2, available_date: new Date().toISOString().split('T')[0], start_time: '14:00', end_time: '17:00', status: 'available' }
            ];
            localStorage.setItem(DB_KEYS.DOCTOR_AVAILABILITY, JSON.stringify(seedAvailability));
        }

        // 13. Bills
        if (!localStorage.getItem(DB_KEYS.BILLS)) {
            const seedBills = [
                { id: 1, patient_id: 4, pharmacist_id: 3, total_amount: 120.00, discount: 0.00, final_amount: 120.00, payment_status: 'paid', payment_method: 'Cash', created_at: new Date().toISOString(), items: [{ name: 'Paracetamol 650mg', quantity: 2, unit_price: 60.00, total_price: 120.00 }] }
            ];
            localStorage.setItem(DB_KEYS.BILLS, JSON.stringify(seedBills));
        }

        // 14. Ambulances
        if (!localStorage.getItem(DB_KEYS.AMBULANCES)) {
            const seedAmbulances = [
                { id: 1, name: 'AMB-101', driver_name: 'Ravi Kumar', phone: '9876543210', vehicle: 'Swift Dzire', status: 'available', lat: 19.0760, lng: 72.8777, eta_min: 5, speed: 0, battery: 92, assigned_request_id: null },
                { id: 2, name: 'AMB-202', driver_name: 'Suresh Patil', phone: '9876543211', vehicle: 'Tata Winger', status: 'available', lat: 19.0822, lng: 72.8813, eta_min: 7, speed: 0, battery: 88, assigned_request_id: null },
                { id: 3, name: 'AMB-303', driver_name: 'Asha Rao', phone: '9876543212', vehicle: 'Toyota Innova', status: 'available', lat: 19.0712, lng: 72.8697, eta_min: 6, speed: 0, battery: 95, assigned_request_id: null }
            ];
            localStorage.setItem(DB_KEYS.AMBULANCES, JSON.stringify(seedAmbulances));
        }

        // 15. Ambulance Requests
        if (!localStorage.getItem(DB_KEYS.AMBULANCE_REQUESTS)) {
            localStorage.setItem(DB_KEYS.AMBULANCE_REQUESTS, JSON.stringify([]));
        }
    },

    // --- User Management ---
    getUsers() {
        const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS)) || [];
        users.forEach(u => {
            if (u.role) {
                u.role = u.role.trim().toLowerCase();
            }
        });
        return users;
    },
    saveUsers(users) {
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    },
    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (user) {
            if (user.status !== 'active') {
                return { success: false, message: 'Account is suspended or pending.' };
            }
            sessionStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
            this.logActivity('Logged into the portal', user.id);
            return { success: true, user };
        }
        return { success: false, message: 'Invalid email or password.' };
    },
    logout() {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            this.logActivity('Logged out from portal', currentUser.id);
        }
        sessionStorage.removeItem(DB_KEYS.CURRENT_USER);
    },
    getCurrentUser() {
        const user = JSON.parse(sessionStorage.getItem(DB_KEYS.CURRENT_USER)) || null;
        if (user && user.role) {
            user.role = user.role.trim().toLowerCase();
        }
        return user;
    },
    register(name, email, password, role = 'patient') {
        if (!validate.required(name) || !validate.required(email) || !validate.required(password)) {
            return { success: false, message: 'Name, email, and password are required.' };
        }
        if (!validate.email(email)) {
            return { success: false, message: 'Please enter a valid email address.' };
        }
        if (!validate.password(password)) {
            return { success: false, message: 'Password must be at least 8 characters long.' };
        }
        const allowedRoles = ['patient', 'doctor', 'pharmacist', 'admin'];
        if (!allowedRoles.includes(role)) {
            return { success: false, message: 'Invalid role type.' };
        }

        const users = this.getUsers();
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, message: 'Email address already registered.' };
        }
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            name,
            email,
            password,
            role,
            status: 'active',
            profile_photo: ''
        };
        users.push(newUser);
        this.saveUsers(users);

        // Auto notification to admin and user
        this.addNotification(newUser.id, `Welcome ${name}! Your account has been registered successfully.`);
        this.addNotification(1, `🔔 New User registered: ${name} (${role})`);
        
        return { success: true, user: newUser };
    },
    updateProfile(userId, name, photoUrl) {
        if (!validate.required(name)) {
            return { success: false, message: 'Name is required.' };
        }

        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index].name = name;
            if (photoUrl !== undefined) {
                users[index].profile_photo = photoUrl;
            }
            this.saveUsers(users);
            
            // Sync with session storage
            const curUser = this.getCurrentUser();
            if (curUser && curUser.id === userId) {
                curUser.name = name;
                if (photoUrl !== undefined) {
                    curUser.profile_photo = photoUrl;
                }
                sessionStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(curUser));
            }
            this.logActivity('Updated profile information', userId);
            return { success: true };
        }
        return { success: false, message: 'User not found.' };
    },
    changePassword(userId, newPassword) {
        if (!validate.password(newPassword)) {
            return { success: false, message: 'Password must be at least 8 characters long.' };
        }

        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index].password = newPassword;
            this.saveUsers(users);
            this.logActivity('Changed password securely', userId);
            return { success: true };
        }
        return { success: false, message: 'User not found.' };
    },

    // --- Medicines Management ---
    getMedicines() {
        return JSON.parse(localStorage.getItem(DB_KEYS.MEDICINES)) || [];
    },
    saveMedicines(medicines) {
        localStorage.setItem(DB_KEYS.MEDICINES, JSON.stringify(medicines));
    },
    updateMedicine(id, stock, threshold, expiryDate) {
        if (!validate.integer(stock) || !validate.integer(threshold)) {
            return { success: false, message: 'Stock and threshold must be positive integers.' };
        }
        if (!validate.date(expiryDate)) {
            return { success: false, message: 'Invalid expiry date format.' };
        }

        const medicines = this.getMedicines();
        const index = medicines.findIndex(m => m.id === id);
        if (index !== -1) {
            medicines[index].stock = parseInt(stock);
            medicines[index].threshold = parseInt(threshold);
            medicines[index].expiry_date = expiryDate;
            
            // Calculate status
            const exp = new Date(expiryDate);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            
            if (exp < now) {
                medicines[index].status = 'expired';
            } else if (medicines[index].stock <= 0) {
                medicines[index].status = 'critical';
            } else if (medicines[index].stock <= medicines[index].threshold) {
                medicines[index].status = 'low';
            } else {
                medicines[index].status = 'normal';
            }

            this.saveMedicines(medicines);
            
            // Log action
            const cur = this.getCurrentUser();
            this.logActivity(`Updated stock for medicine ${medicines[index].name} to ${stock}`, cur ? cur.id : 1);
            
            // Trigger auto alert notifications if status is critical/expired
            if (medicines[index].status === 'critical' || medicines[index].status === 'expired') {
                const adminsAndPharmacists = this.getUsers().filter(u => u.role === 'admin' || u.role === 'pharmacist');
                adminsAndPharmacists.forEach(ap => {
                    this.addNotification(ap.id, `🚨 Medicine Warning: "${medicines[index].name}" status is now ${medicines[index].status.toUpperCase()}!`);
                });
            }

            return { success: true, medicine: medicines[index] };
        }
        return { success: false, message: 'Medicine not found.' };
    },
    addMedicine(name, stock, threshold, expiryDate) {
        if (!validate.required(name) || !validate.required(expiryDate)) {
            return { success: false, message: 'Medicine name and expiry date are required.' };
        }
        if (!validate.integer(stock) || !validate.integer(threshold)) {
            return { success: false, message: 'Stock and threshold must be positive integers.' };
        }
        if (!validate.date(expiryDate)) {
            return { success: false, message: 'Invalid expiry date format.' };
        }

        const medicines = this.getMedicines();
        const newMed = {
            id: medicines.length > 0 ? Math.max(...medicines.map(m => m.id)) + 1 : 1,
            name,
            stock: parseInt(stock),
            threshold: parseInt(threshold),
            expiry_date: expiryDate,
            status: 'normal'
        };
        
        // Calculate status
        const exp = new Date(expiryDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (exp < now) newMed.status = 'expired';
        else if (newMed.stock <= 0) newMed.status = 'critical';
        else if (newMed.stock <= newMed.threshold) newMed.status = 'low';

        medicines.push(newMed);
        this.saveMedicines(medicines);
        
        const cur = this.getCurrentUser();
        this.logActivity(`Added new medicine: ${name} with stock ${stock}`, cur ? cur.id : 1);
        return { success: true, medicine: newMed };
    },
    deleteMedicine(id) {
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) {
            return { success: false, message: 'Invalid medicine ID.' };
        }

        let medicines = this.getMedicines();
        const item = medicines.find(m => m.id === parsedId);
        if (item) {
            medicines = medicines.filter(m => m.id !== parsedId);
            this.saveMedicines(medicines);
            const cur = this.getCurrentUser();
            this.logActivity(`Deleted medicine: ${item.name}`, cur ? cur.id : 1);
            return { success: true };
        }
        return { success: false, message: 'Medicine not found.' };
    },

    // --- Bed Inventory Management ---
    getBeds() {
        return JSON.parse(localStorage.getItem(DB_KEYS.BEDS)) || [];
    },
    saveBeds(beds) {
        localStorage.setItem(DB_KEYS.BEDS, JSON.stringify(beds));
    },
    updateBeds(id, total, occupied) {
        if (!validate.integer(total) || !validate.integer(occupied)) {
            return { success: false, message: 'Total beds and occupied beds must be positive integers.' };
        }
        if (parseInt(occupied, 10) > parseInt(total, 10)) {
            return { success: false, message: 'Occupied beds cannot exceed total bed capacity.' };
        }

        const beds = this.getBeds();
        const index = beds.findIndex(b => b.id === id);
        if (index !== -1) {
            beds[index].total = parseInt(total);
            beds[index].occupied = parseInt(occupied);
            this.saveBeds(beds);
            const cur = this.getCurrentUser();
            this.logActivity(`Updated ${beds[index].ward_type} beds to total=${total}, occupied=${occupied}`, cur ? cur.id : 1);
            return { success: true };
        }
        return { success: false, message: 'Ward not found.' };
    },

    // --- Patient Flow / Consultation Queue Management ---
    getPatientFlow() {
        return JSON.parse(localStorage.getItem(DB_KEYS.PATIENT_FLOW)) || [];
    },
    savePatientFlow(flow) {
        localStorage.setItem(DB_KEYS.PATIENT_FLOW, JSON.stringify(flow));
    },
    joinQueue(patientId, doctorId) {
        const parsedPatientId = parseInt(patientId, 10);
        const parsedDoctorId = parseInt(doctorId, 10);
        if (isNaN(parsedPatientId) || isNaN(parsedDoctorId)) {
            return { success: false, message: 'Invalid patient or doctor identifier.' };
        }

        const flow = this.getPatientFlow();
        // Check if already active in queue
        const active = flow.find(f => f.patient_id === parsedPatientId && (f.status === 'waiting' || f.status === 'in-consultation'));
        if (active) {
            return { success: false, message: 'You are already active in the queue.' };
        }
        
        const doctors = this.getUsers().filter(u => u.role === 'doctor');
        const doc = doctors.find(d => d.id === parsedDoctorId);
        if (!doc) {
            return { success: false, message: 'Selected doctor is invalid.' };
        }

        const newFlow = {
            id: flow.length > 0 ? Math.max(...flow.map(f => f.id)) + 1 : 1,
            patient_id: parsedPatientId,
            doctor_id: parsedDoctorId,
            queue_time: new Date().toISOString(),
            wait_time_minutes: this.calculateWaitTime(parsedDoctorId),
            status: 'waiting',
            diagnosis_notes: ''
        };
        
        flow.push(newFlow);
        this.savePatientFlow(flow);
        
        const curUser = this.getCurrentUser();
        const patientName = curUser ? curUser.name : 'Unknown Patient';
        this.addNotification(parsedDoctorId, `🔔 New Patient queued: ${patientName}`);
        this.logActivity(`Joined wait queue for Doctor: ${doc.name}`, parsedPatientId);
        
        return { success: true, message: `Successfully joined Dr. ${doc.name}'s queue.` };
    },
    calculateWaitTime(doctorId) {
        // Simple mock calculation: 15 minutes per waiting patient in front
        const flow = this.getPatientFlow();
        const activeQueued = flow.filter(f => f.doctor_id === doctorId && f.status === 'waiting');
        return (activeQueued.length + 1) * 15;
    },
    updateQueueStatus(flowId, status, diagnosisNotes = '') {
        const parsedFlowId = parseInt(flowId, 10);
        if (isNaN(parsedFlowId)) {
            return { success: false, message: 'Invalid flow record identifier.' };
        }
        const allowedStatuses = ['waiting', 'in-consultation', 'completed', 'cancelled'];
        if (!allowedStatuses.includes(status)) {
            return { success: false, message: 'Invalid status type.' };
        }

        const flow = this.getPatientFlow();
        const index = flow.findIndex(f => f.id === parsedFlowId);
        if (index !== -1) {
            flow[index].status = status;
            if (diagnosisNotes !== undefined) {
                flow[index].diagnosis_notes = diagnosisNotes;
            }
            this.savePatientFlow(flow);

            const patientId = flow[index].patient_id;
            const cur = this.getCurrentUser();
            
            if (status === 'completed') {
                this.addNotification(patientId, `🩺 Your consultation with Dr. ${cur ? cur.name : 'Doctor'} is complete. Diagnosis notes updated.`);
            } else if (status === 'in-consultation') {
                this.addNotification(patientId, `🩺 Dr. ${cur ? cur.name : 'Doctor'} has called you in. Please proceed to the room.`);
            } else if (status === 'cancelled') {
                this.addNotification(patientId, `❌ Your appointment status has been updated to Cancelled.`);
            }
            
            return { success: true };
        }
        return { success: false, message: 'Flow record not found.' };
    },

    // --- Doctor Attendance / Roster ---
    getDoctorAttendance() {
        return JSON.parse(localStorage.getItem(DB_KEYS.ATTENDANCE)) || [];
    },
    saveDoctorAttendance(attendance) {
        localStorage.setItem(DB_KEYS.ATTENDANCE, JSON.stringify(attendance));
    },
    markAttendance(doctorId, status, checkIn = null, checkOut = null) {
        const parsedDoctorId = parseInt(doctorId, 10);
        if (isNaN(parsedDoctorId)) {
            return { success: false, message: 'Invalid doctor identifier.' };
        }
        const allowedStatuses = ['present', 'absent', 'on-leave'];
        if (!allowedStatuses.includes(status)) {
            return { success: false, message: 'Invalid attendance status.' };
        }

        const attendance = this.getDoctorAttendance();
        const todayStr = new Date().toISOString().split('T')[0];
        
        const index = attendance.findIndex(a => a.doctor_id === parsedDoctorId && a.record_date === todayStr);
        if (index !== -1) {
            attendance[index].status = status;
            if (checkIn) attendance[index].check_in = checkIn;
            if (checkOut) attendance[index].check_out = checkOut;
        } else {
            attendance.push({
                id: attendance.length > 0 ? Math.max(...attendance.map(a => a.id)) + 1 : 1,
                doctor_id: parsedDoctorId,
                record_date: todayStr,
                status,
                check_in: checkIn || new Date().toTimeString().split(' ')[0].substring(0, 5),
                check_out: checkOut
            });
        }
        this.saveDoctorAttendance(attendance);
        this.logActivity(`Marked attendance as ${status.toUpperCase()}`, parsedDoctorId);
        return { success: true };
    },

    // --- CMS Content Management ---
    getPageContents() {
        return JSON.parse(localStorage.getItem(DB_KEYS.PAGE_CONTENTS)) || [];
    },
    savePageContents(contents) {
        localStorage.setItem(DB_KEYS.PAGE_CONTENTS, JSON.stringify(contents));
    },
    updateCMS(slug, title, content) {
        if (!validate.required(title) || !validate.required(content)) {
            return { success: false, message: 'Title and content are required.' };
        }
        const allowedSlugs = ['about', 'services'];
        if (!allowedSlugs.includes(slug)) {
            return { success: false, message: 'Invalid page identifier.' };
        }

        const contents = this.getPageContents();
        const index = contents.findIndex(c => c.slug === slug);
        if (index !== -1) {
            contents[index].title = title;
            contents[index].content = content;
            this.savePageContents(contents);
            
            const cur = this.getCurrentUser();
            this.logActivity(`Updated CMS page: ${slug}`, cur ? cur.id : 1);
            return { success: true };
        }
        return { success: false, message: 'CMS page not found.' };
    },

    // --- Ambulance Management ---
    getAmbulances() {
        return JSON.parse(localStorage.getItem(DB_KEYS.AMBULANCES)) || [];
    },
    saveAmbulances(ambulances) {
        localStorage.setItem(DB_KEYS.AMBULANCES, JSON.stringify(ambulances));
    },
    getAmbulanceRequests() {
        return JSON.parse(localStorage.getItem(DB_KEYS.AMBULANCE_REQUESTS)) || [];
    },
    saveAmbulanceRequests(requests) {
        localStorage.setItem(DB_KEYS.AMBULANCE_REQUESTS, JSON.stringify(requests));
    },
    getActiveAmbulanceRequest(patientId) {
        const requests = this.getAmbulanceRequests();
        return requests.find(req => req.patient_id === parseInt(patientId, 10) && ['pending', 'assigned', 'dispatched', 'near-patient', 'arriving', 'arrived'].includes(req.status)) || null;
    },
    createAmbulanceRequest(patientId, details = {}) {
        const parsedPatientId = parseInt(patientId, 10);
        if (isNaN(parsedPatientId)) {
            return { success: false, message: 'Invalid patient identifier.' };
        }
        const existing = this.getActiveAmbulanceRequest(parsedPatientId);
        if (existing) {
            return { success: false, message: 'You already have an active ambulance request.', request: existing };
        }

        const currentUser = this.getCurrentUser() || { name: 'Patient', role: 'patient' };
        const requests = this.getAmbulanceRequests();
        const newRequest = {
            id: requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1,
            patient_id: parsedPatientId,
            patient_name: details.patient_name || currentUser.name || 'Patient',
            age: details.age || 32,
            symptoms: details.symptoms || 'Emergency assistance requested',
            priority: details.priority || 'medium',
            requested_at: new Date().toISOString(),
            status: 'pending',
            assigned_ambulance_id: null,
            ambulance_id: null,
            eta_min: 12,
            distance_km: 4.8,
            progress: 0,
            route_coords: [],
            current_lat: 19.0760,
            current_lng: 72.8777,
            last_updated: new Date().toISOString(),
            driver_name: '',
            vehicle: '',
            phone: '',
            hospital_name: 'Smart Health Hub',
            hospital_lat: 19.0760,
            hospital_lng: 72.8777,
            patient_lat: 19.0840,
            patient_lng: 72.8820
        };

        requests.push(newRequest);
        this.saveAmbulanceRequests(requests);
        this.addNotification(parsedPatientId, '🚑 Ambulance requested successfully. Dispatch team is reviewing your request.');
        this.addNotification(1, `🚨 New ambulance request received from ${newRequest.patient_name} (${newRequest.priority.toUpperCase()}).`);
        this.logActivity(`Requested ambulance for patient ID ${parsedPatientId}`, parsedPatientId);
        return { success: true, request: newRequest };
    },
    assignAmbulanceRequest(requestId, ambulanceId, assignedByUserId = null) {
        const parsedRequestId = parseInt(requestId, 10);
        const parsedAmbulanceId = parseInt(ambulanceId, 10);
        if (isNaN(parsedRequestId) || isNaN(parsedAmbulanceId)) {
            return { success: false, message: 'Invalid request or ambulance identifier.' };
        }

        const requests = this.getAmbulanceRequests();
        const request = requests.find(item => item.id === parsedRequestId);
        const ambulances = this.getAmbulances();
        const ambulance = ambulances.find(item => item.id === parsedAmbulanceId);
        if (!request || !ambulance) {
            return { success: false, message: 'Ambulance request or ambulance not found.' };
        }
        if (ambulance.status !== 'available') {
            return { success: false, message: 'Selected ambulance is currently unavailable.' };
        }

        request.status = 'assigned';
        request.assigned_ambulance_id = parsedAmbulanceId;
        request.ambulance_id = parsedAmbulanceId;
        request.driver_name = ambulance.driver_name;
        request.vehicle = ambulance.vehicle;
        request.phone = ambulance.phone;
        request.last_updated = new Date().toISOString();
        request.progress = 10;
        request.eta_min = 6;
        request.distance_km = 3.8;
        ambulance.status = 'assigned';
        ambulance.assigned_request_id = parsedRequestId;
        this.saveAmbulanceRequests(requests);
        this.saveAmbulances(ambulances);
        this.addNotification(request.patient_id, `🚑 Ambulance ${ambulance.name} has been assigned to you. Dispatch is in progress.`);
        this.addNotification(1, `🚑 Ambulance request #${request.id} assigned to ${ambulance.name}.`);
        this.logActivity(`Assigned ambulance ${ambulance.name} to request ${request.id}`, assignedByUserId || request.patient_id);
        return { success: true, request };
    },
    updateAmbulanceRequest(requestId, updates = {}) {
        const parsedRequestId = parseInt(requestId, 10);
        if (isNaN(parsedRequestId)) {
            return { success: false, message: 'Invalid request identifier.' };
        }

        const requests = this.getAmbulanceRequests();
        const index = requests.findIndex(item => item.id === parsedRequestId);
        if (index === -1) {
            return { success: false, message: 'Ambulance request not found.' };
        }

        requests[index] = { ...requests[index], ...updates, last_updated: new Date().toISOString() };
        this.saveAmbulanceRequests(requests);
        return { success: true, request: requests[index] };
    },
    updateAmbulanceRequestStatus(requestId, status, details = {}) {
        const parsedRequestId = parseInt(requestId, 10);
        const allowedStatuses = ['pending', 'assigned', 'dispatched', 'near-patient', 'arriving', 'arrived', 'completed', 'cancelled'];
        if (isNaN(parsedRequestId) || !allowedStatuses.includes(status)) {
            return { success: false, message: 'Invalid ambulance request state.' };
        }

        const requests = this.getAmbulanceRequests();
        const request = requests.find(item => item.id === parsedRequestId);
        if (!request) {
            return { success: false, message: 'Ambulance request not found.' };
        }

        request.status = status;
        request.last_updated = new Date().toISOString();
        if (details.eta_min !== undefined) request.eta_min = details.eta_min;
        if (details.distance_km !== undefined) request.distance_km = details.distance_km;
        if (details.progress !== undefined) request.progress = details.progress;
        if (details.current_lat !== undefined) request.current_lat = details.current_lat;
        if (details.current_lng !== undefined) request.current_lng = details.current_lng;
        if (details.route_coords) request.route_coords = details.route_coords;
        if (details.driver_name !== undefined) request.driver_name = details.driver_name;
        if (details.vehicle !== undefined) request.vehicle = details.vehicle;
        if (details.phone !== undefined) request.phone = details.phone;

        const ambulances = this.getAmbulances();
        const ambulance = ambulances.find(item => item.id === request.assigned_ambulance_id);
        if (ambulance) {
            if (status === 'completed' || status === 'cancelled') {
                ambulance.status = 'available';
                ambulance.assigned_request_id = null;
            } else if (status === 'dispatched' || status === 'near-patient' || status === 'arriving' || status === 'arrived') {
                ambulance.status = 'on-route';
                ambulance.assigned_request_id = request.id;
            }
            this.saveAmbulances(ambulances);
        }

        this.saveAmbulanceRequests(requests);
        const statusMessage = {
            assigned: '🚑 Ambulance assigned successfully.',
            dispatched: '🚑 Ambulance is now on the way.',
            'near-patient': '🚑 Ambulance is nearing your location.',
            arriving: '🚑 Ambulance is arriving at your location.',
            arrived: '🚑 Ambulance has arrived at your location.',
            completed: '✅ Ambulance trip completed successfully.',
            cancelled: '❌ Ambulance request was cancelled.'
        }[status] || 'Ambulance status updated.';
        this.addNotification(request.patient_id, statusMessage);
        this.logActivity(`Updated ambulance request ${request.id} to ${status}`, request.patient_id);
        return { success: true, request };
    },

    // --- Notifications ---
    getNotifications() {
        return JSON.parse(localStorage.getItem(DB_KEYS.NOTIFICATIONS)) || [];
    },
    saveNotifications(notifs) {
        localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    },
    addNotification(userId, message) {
        const notifs = this.getNotifications();
        const newNotif = {
            id: notifs.length > 0 ? Math.max(...notifs.map(n => n.id)) + 1 : 1,
            user_id: parseInt(userId),
            message,
            is_read: false,
            created_at: new Date().toISOString()
        };
        notifs.push(newNotif);
        this.saveNotifications(notifs);
        return newNotif;
    },
    getUnreadNotificationsCount(userId) {
        return this.getNotifications().filter(n => n.user_id === userId && !n.is_read).length;
    },
    markNotificationsAsRead(userId) {
        const notifs = this.getNotifications();
        notifs.forEach(n => {
            if (n.user_id === userId) {
                n.is_read = true;
            }
        });
        this.saveNotifications(notifs);
        return true;
    },

    // --- Contact Feedback ---
    getFeedback() {
        return JSON.parse(localStorage.getItem(DB_KEYS.FEEDBACK)) || [];
    },
    saveFeedback(feedbacks) {
        localStorage.setItem(DB_KEYS.FEEDBACK, JSON.stringify(feedbacks));
    },
    addFeedback(name, email, formType, subject, message) {
        if (!validate.required(name) || !validate.required(email) || !validate.required(subject) || !validate.required(message)) {
            return { success: false, message: 'All form fields are required.' };
        }
        if (!validate.email(email)) {
            return { success: false, message: 'Please enter a valid email address.' };
        }
        const allowedFormTypes = ['general', 'inventory', 'bug', 'feedback', 'contact'];
        if (!allowedFormTypes.includes(formType)) {
            return { success: false, message: 'Invalid form category type.' };
        }

        const feedbacks = this.getFeedback();
        const newFeedback = {
            id: feedbacks.length > 0 ? Math.max(...feedbacks.map(f => f.id)) + 1 : 1,
            name,
            email,
            form_type: formType,
            subject,
            message,
            created_at: new Date().toISOString()
        };
        feedbacks.push(newFeedback);
        this.saveFeedback(feedbacks);

        // Sync to Firebase Firestore under inquiries collection
        if (typeof firebase !== 'undefined') {
            try {
                firebase.firestore().collection('inquiries').add(newFeedback);
            } catch (e) {
                console.error("Firestore sync failed for inquiry:", e);
            }
        }
        
        // Notify admin
        this.addNotification(1, `📬 New ${formType} submitted: "${subject}" by ${name}`);
        return { success: true };
    },

    // --- Gallery Management ---
    getGallery() {
        return JSON.parse(localStorage.getItem(DB_KEYS.GALLERY)) || [];
    },
    saveGallery(gallery) {
        localStorage.setItem(DB_KEYS.GALLERY, JSON.stringify(gallery));
    },
    addGalleryImage(caption, base64Data) {
        if (!validate.required(caption) || !validate.required(base64Data)) {
            return { success: false, message: 'Caption and image data are required.' };
        }

        const gallery = this.getGallery();
        const newImg = {
            id: gallery.length > 0 ? Math.max(...gallery.map(g => g.id)) + 1 : 1,
            caption,
            path: base64Data, // Stored directly as base64 string
            created_at: new Date().toISOString()
        };
        gallery.push(newImg);
        this.saveGallery(gallery);
        
        const cur = this.getCurrentUser();
        this.logActivity(`Uploaded a new gallery image with caption: ${caption}`, cur ? cur.id : 1);
        return { success: true };
    },
    deleteGalleryImage(id) {
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) {
            return { success: false, message: 'Invalid gallery image identifier.' };
        }

        let gallery = this.getGallery();
        const item = gallery.find(g => g.id === parsedId);
        if (item) {
            gallery = gallery.filter(g => g.id !== parsedId);
            this.saveGallery(gallery);
            const cur = this.getCurrentUser();
            this.logActivity(`Deleted gallery image with caption: ${item.caption}`, cur ? cur.id : 1);
            return { success: true };
        }
        return { success: false, message: 'Image not found.' };
    },

    // --- Activity Audit Logs ---
    getLogs() {
        return JSON.parse(localStorage.getItem(DB_KEYS.ACTIVITY_LOGS)) || [];
    },
    logActivity(action, userId = null) {
        const logs = this.getLogs();
        const newLog = {
            id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
            user_id: userId,
            action,
            ip_address: '127.0.0.1 (Local Simulation)',
            user_agent: navigator.userAgent,
            created_at: new Date().toISOString()
        };
        logs.push(newLog);
        localStorage.setItem(DB_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
    },

    // --- Metrics ---
    getLiveMetrics() {
        const beds = this.getBeds();
        const medicines = this.getMedicines();
        const users = this.getUsers();
        const attendance = this.getDoctorAttendance();
        
        const totalBeds = beds.reduce((sum, b) => sum + b.total, 0);
        const occupiedBeds = beds.reduce((sum, b) => sum + b.occupied, 0);
        const availableBeds = totalBeds - occupiedBeds;
        
        const doctors = users.filter(u => u.role === 'doctor');
        const activeDoctorsCount = doctors.filter(d => d.status === 'active').length;
        const patientsCount = users.filter(u => u.role === 'patient').length;
        
        const lowStockCount = medicines.filter(m => m.status === 'low' || m.status === 'critical' || m.status === 'expired').length;

        // Calculate attendance rate for today
        const todayStr = new Date().toISOString().split('T')[0];
        const presentToday = attendance.filter(a => a.record_date === todayStr && a.status === 'present').length;
        const attendanceRate = activeDoctorsCount > 0 ? Math.round((presentToday / activeDoctorsCount) * 100) : 92;
        return {
            hospitalsCount: 4, // static mock
            doctorsCount: activeDoctorsCount,
            patientsCount,
            availableBeds,
            lowStockCount,
            attendanceRate
        };
    },

    // --- Appointments Management ---
    getAppointments() {
        return JSON.parse(localStorage.getItem(DB_KEYS.APPOINTMENTS)) || [];
    },
    saveAppointments(appts) {
        localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(appts));
    },
    bookAppointment(patientId, doctorId, date, slot, symptoms) {
        const appts = this.getAppointments();
        const newAppt = {
            id: appts.length > 0 ? Math.max(...appts.map(a => a.id)) + 1 : 1,
            patient_id: parseInt(patientId),
            doctor_id: parseInt(doctorId),
            appointment_date: date,
            time_slot: slot,
            status: 'pending',
            symptoms: symptoms,
            cancellation_reason: ''
        };
        appts.push(newAppt);
        this.saveAppointments(appts);
        this.logActivity(`Booked appointment with Doctor ID: ${doctorId}`, patientId);
        
        // Notify doctor
        this.addNotification(doctorId, `📅 New appointment request received from Patient ID: ${patientId}`);
        return { success: true, appointment: newAppt };
    },
    updateAppointmentStatus(id, status, reason = '') {
        const appts = this.getAppointments();
        const idx = appts.findIndex(a => a.id === parseInt(id));
        if (idx !== -1) {
            appts[idx].status = status;
            if (reason) appts[idx].cancellation_reason = reason;
            this.saveAppointments(appts);
            
            const patientId = appts[idx].patient_id;
            const doctorId = appts[idx].doctor_id;
            const doc = this.getUsers().find(u => u.id === doctorId);
            const docName = doc ? doc.name : 'Doctor';
            
            // Notify patient
            this.addNotification(patientId, `📅 Your appointment with Dr. ${docName} has been ${status.toUpperCase()}.`);
            this.logActivity(`Updated appointment ID ${id} status to ${status}`, doctorId);
            return { success: true };
        }
        return { success: false, message: 'Appointment not found.' };
    },

    // --- Doctor Availability Roster ---
    getDoctorSchedules() {
        return JSON.parse(localStorage.getItem(DB_KEYS.DOCTOR_AVAILABILITY)) || [];
    },
    saveDoctorSchedules(scheds) {
        localStorage.setItem(DB_KEYS.DOCTOR_AVAILABILITY, JSON.stringify(scheds));
    },
    setDoctorSchedule(doctorId, date, startTime, endTime, status = 'available') {
        const scheds = this.getDoctorSchedules();
        const newSched = {
            id: scheds.length > 0 ? Math.max(...scheds.map(s => s.id)) + 1 : 1,
            doctor_id: parseInt(doctorId),
            available_date: date,
            start_time: startTime,
            end_time: endTime,
            status: status
        };
        scheds.push(newSched);
        this.saveDoctorSchedules(scheds);
        this.logActivity(`Added availability slot on ${date} ${startTime}-${endTime}`, doctorId);
        return { success: true, schedule: newSched };
    },
    updateDoctorScheduleStatus(scheduleId, status) {
        const scheds = this.getDoctorSchedules();
        const idx = scheds.findIndex(s => s.id === parseInt(scheduleId));
        if (idx !== -1) {
            scheds[idx].status = status;
            this.saveDoctorSchedules(scheds);
            this.logActivity(`Updated schedule ID ${scheduleId} state to ${status}`, scheds[idx].doctor_id);
            return { success: true };
        }
        return { success: false, message: 'Schedule slot not found.' };
    },

    // --- Billing System ---
    getBills() {
        return JSON.parse(localStorage.getItem(DB_KEYS.BILLS)) || [];
    },
    saveBills(bills) {
        localStorage.setItem(DB_KEYS.BILLS, JSON.stringify(bills));
    },
    createBill(patientId, pharmacistId, items, discount = 0) {
        const bills = this.getBills();
        
        let total = 0;
        items.forEach(it => {
            it.total_price = it.quantity * it.unit_price;
            total += it.total_price;
        });
        
        const finalAmt = Math.max(0, total - parseFloat(discount));
        
        const newBill = {
            id: bills.length > 0 ? Math.max(...bills.map(b => b.id)) + 1 : 1,
            patient_id: parseInt(patientId),
            pharmacist_id: parseInt(pharmacistId),
            total_amount: total,
            discount: parseFloat(discount),
            final_amount: finalAmt,
            payment_status: 'unpaid',
            payment_method: '',
            created_at: new Date().toISOString(),
            items: items
        };
        
        bills.push(newBill);
        this.saveBills(bills);
        
        // Notify patient
        this.addNotification(patientId, `💵 A new bill of amount ₹${finalAmt.toFixed(2)} has been generated for you.`);
        this.logActivity(`Created bill ID ${newBill.id} for Patient ID: ${patientId}`, pharmacistId);
        return { success: true, bill: newBill };
    },
    payBill(billId, method) {
        const bills = this.getBills();
        const idx = bills.findIndex(b => b.id === parseInt(billId));
        if (idx !== -1) {
            bills[idx].payment_status = 'paid';
            bills[idx].payment_method = method;
            this.saveBills(bills);
            this.logActivity(`Processed payment for Bill ID: ${billId} using ${method}`, bills[idx].patient_id);
            return { success: true };
        }
        return { success: false, message: 'Bill not found.' };
    }
};

// Initialize DB immediately
db.init();

// Export to window object for global availability
window.db = db;
