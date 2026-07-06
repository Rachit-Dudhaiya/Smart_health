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
    GALLERY: 'sh_gallery'
};

const db = {
    // Initialize DB with seed data if empty
    init() {
        // 1. Users
        if (!localStorage.getItem(DB_KEYS.USERS)) {
            const seedUsers = [
                { id: 1, name: 'System Admin', email: 'admin@smarthealth.com', password: 'Admin123!', role: 'admin', status: 'active', profile_photo: '' },
                { id: 2, name: 'Dr. Aditi Shah', email: 'doctor@smarthealth.com', password: 'Doctor123!', role: 'doctor', status: 'active', profile_photo: '' },
                { id: 3, name: 'Rahul Pharmacist', email: 'pharmacist@smarthealth.com', password: 'Pharmacist123!', role: 'pharmacist', status: 'active', profile_photo: '' },
                { id: 4, name: 'Rajesh Kumar', email: 'patient@smarthealth.com', password: 'Patient123!', role: 'patient', status: 'active', profile_photo: '' }
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
    },

    // --- User Management ---
    getUsers() {
        return JSON.parse(localStorage.getItem(DB_KEYS.USERS)) || [];
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
        return JSON.parse(sessionStorage.getItem(DB_KEYS.CURRENT_USER)) || null;
    },
    register(name, email, password, role = 'patient') {
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
        let medicines = this.getMedicines();
        const item = medicines.find(m => m.id === id);
        if (item) {
            medicines = medicines.filter(m => m.id !== id);
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
        const flow = this.getPatientFlow();
        // Check if already active in queue
        const active = flow.find(f => f.patient_id === patientId && (f.status === 'waiting' || f.status === 'in-consultation'));
        if (active) {
            return { success: false, message: 'You are already active in the queue.' };
        }
        
        const doctors = this.getUsers().filter(u => u.role === 'doctor');
        const doc = doctors.find(d => d.id === doctorId);
        if (!doc) {
            return { success: false, message: 'Selected doctor is invalid.' };
        }

        const newFlow = {
            id: flow.length > 0 ? Math.max(...flow.map(f => f.id)) + 1 : 1,
            patient_id: patientId,
            doctor_id: doctorId,
            queue_time: new Date().toISOString(),
            wait_time_minutes: this.calculateWaitTime(doctorId),
            status: 'waiting',
            diagnosis_notes: ''
        };
        
        flow.push(newFlow);
        this.savePatientFlow(flow);
        
        const curUser = this.getCurrentUser();
        const patientName = curUser ? curUser.name : 'Unknown Patient';
        this.addNotification(doctorId, `🔔 New Patient queued: ${patientName}`);
        this.logActivity(`Joined wait queue for Doctor: ${doc.name}`, patientId);
        
        return { success: true, message: `Successfully joined Dr. ${doc.name}'s queue.` };
    },
    calculateWaitTime(doctorId) {
        // Simple mock calculation: 15 minutes per waiting patient in front
        const flow = this.getPatientFlow();
        const activeQueued = flow.filter(f => f.doctor_id === doctorId && f.status === 'waiting');
        return (activeQueued.length + 1) * 15;
    },
    updateQueueStatus(flowId, status, diagnosisNotes = '') {
        const flow = this.getPatientFlow();
        const index = flow.findIndex(f => f.id === flowId);
        if (index !== -1) {
            flow[index].status = status;
            if (diagnosisNotes) {
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
        const attendance = this.getDoctorAttendance();
        const todayStr = new Date().toISOString().split('T')[0];
        
        const index = attendance.findIndex(a => a.doctor_id === doctorId && a.record_date === todayStr);
        if (index !== -1) {
            attendance[index].status = status;
            if (checkIn) attendance[index].check_in = checkIn;
            if (checkOut) attendance[index].check_out = checkOut;
        } else {
            attendance.push({
                id: attendance.length > 0 ? Math.max(...attendance.map(a => a.id)) + 1 : 1,
                doctor_id: doctorId,
                record_date: todayStr,
                status,
                check_in: checkIn || new Date().toTimeString().split(' ')[0].substring(0, 5),
                check_out: checkOut
            });
        }
        this.saveDoctorAttendance(attendance);
        this.logActivity(`Marked attendance as ${status.toUpperCase()}`, doctorId);
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
        let gallery = this.getGallery();
        const item = gallery.find(g => g.id === id);
        if (item) {
            gallery = gallery.filter(g => g.id !== id);
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
    }
};

// Initialize DB immediately
db.init();

// Export to window object for global availability
window.db = db;
