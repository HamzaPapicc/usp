import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "app_language";

const translations = {
    en: {
        language: {
            label: "Language",
            english: "English",
            serbian: "Serbian",
        },
        common: {
            loading: "Loading...",
            back: "Back",
            cancel: "Cancel",
            save: "Save",
            unsave: "Unsave",
            report: "Report",
            edit: "Edit",
            delete: "Delete",
            submit: "Submit",
            search: "Search",
            email: "Email",
            phone: "Phone",
            username: "Username",
            password: "Password",
            confirmPassword: "Confirm password",
            displayName: "Display name",
            salary: "Salary",
            description: "Description",
            title: "Title",
        },
        home: {
            fetchFailed: "Failed to fetch ads.",
            searchPlaceholder: "Search...",
            loadingInitial: "Loading ads...",
            empty: "No advertisements match your current search and filters.",
        },
        loginPage: {
            title: "Log in",
            noAccount: "Don't have an account?",
            register: "Register",
            forgotPassword: "Forgot password",
        },
        registerPage: {
            title: "Register",
            alreadyHaveAccount: "Already have an account?",
            login: "Log in",
        },
        loginForm: {
            invalidCredentials: "Invalid username or password.",
            loginFailed: "Login failed, please try again.",
        },
        registerForm: {
            passwordsDontMatch: "Passwords don't match.",
            registering: "Registering...",
            register: "Register",
        },
        createAd: {
            pageTitle: "Create an advertisement",
            failedToCreate: "Failed to create ad.",
            typeOfSalary: "Type of salary",
            workTime: "Work time",
            positionType: "Position type",
            selectPosition: "Select position",
            address: "Address",
            banner: "Banner",
            monthly: "Monthly",
            daily: "Daily",
            hourly: "Hourly",
            waiter: "Waiter",
            bartender: "Bartender",
            chef: "Chef",
            driver: "Driver",
            truckDriver: "Truck driver",
            cashier: "Cashier",
            delivery: "Delivery",
            warehouseWorker: "Warehouse worker",
            janitor: "Janitor",
            contactEmail: "Contact email",
            contactPhone: "Contact phone",
            contactRequired: "Please provide both contact email and phone number.",
            creating: "Creating...",
            createButton: "Create ad",
        },
        adDetail: {
            failedLoad: "Failed to load advertisement.",
            failedSaveToggle: "Failed to update saved status.",
            failedSubmitReport: "Failed to submit report.",
            reportSubmitted: "Report submitted.",
            confirmDelete: "Are you sure?",
            reportPrompt: "Why are you reporting this advertisement?",
            loading: "Loading advertisement...",
            headerCaption: "Advertisement details",
            salaryNotSpecified: "Not specified",
            postedBy: "Posted by",
            savedByUsers: "Saved by {{count}} users",
            contactDetails: "Contact details",
            contactEmail: "Contact email",
            contactPhone: "Contact phone",
            contactNotProvided: "Not provided",
        },
        profile: {
            failedSave: "Failed to save.",
            reportPrompt: "Why are you reporting this ad?",
            reportSuccess: "Reported successfully.",
            failedReport: "Failed to report.",
            reportProfile: "Report profile",
            reportProfilePrompt: "Why are you reporting this profile?",
            reportProfileSuccess: "Profile reported successfully.",
            reportProfileFailed: "Failed to report profile.",
            confirmDelete: "Are you sure?",
            deleteFailed: "Delete failed.",
            failedFetchProfile: "Failed to fetch profile.",
            notFound: "Profile not found.",
            editProfile: "Edit profile",
            bio: "Bio",
            phone: "Phone",
            advertisements: "Advertisements",
            noAdvertisements: "No advertisements yet.",
        },
        savedAds: {
            failedLoad: "Failed to load saved ads.",
            title: "Saved advertisements",
            empty: "You haven't saved any advertisements yet.",
        },
        editAd: {
            failedLoad: "Failed to load advertisement.",
            failedUpdate: "Failed to update advertisement.",
            title: "Edit advertisement",
            typeOfWorker: "Type of worker",
            bannerImage: "Banner image",
            saveChanges: "Save changes",
            subtitle: "Update advertisement details and contact info.",
            saving: "Saving changes...",
            updated: "Advertisement updated successfully.",
            currentImage: "Current banner image",
        },
        editProfile: {
            title: "Edit profile",
            failedLoad: "Failed to load profile.",
            updateFailed: "Update failed.",
            updated: "Profile updated",
            bio: "Bio",
            phoneNumber: "Phone number",
            saving: "Saving...",
            saveChanges: "Save changes",
            changePassword: "Change password",
            deleteAccount: "Delete account",
        },
        auth: {
            resetPasswordTitle: "Reset your password.",
            resetPasswordRequestTitle: "Enter your email to reset your password",
            passwordsDoNotMatch: "Passwords do not match.",
            resetFailed: "Reset failed",
            resetSuccess: "Password reset successfully.",
            newPassword: "New password",
            resetting: "Resetting...",
            resetPassword: "Reset password",
            emailSent: "Email has been sent.",
            sendFailed: "Something went wrong, please try again.",
            sending: "Sending...",
            sendEmail: "Send email",
            logoutFailed: "Failed to log out. Please try again.",
        },
        emailVerification: {
            notVerifiedTitle: "Email not verified",
            notVerifiedSubtitle: "Please verify your email to continue",
            resend: "Resend email verification",
            failedResend: "Failed to resend verification email",
            usernameRequired: "Please enter your username first.",
            checkInbox: "Check your email for the verification.",
            goBack: "Go back",
            verifying: "Verifying...",
            verifiedCanLogin: "Your email has been verified, you can now log in.",
            verificationFailed: "Verification failed",
            resendLink: "Resend verification email",
        },
        notFound: {
            pageNotFound: "Page not found",
        },
        sideMenu: {
            login: "Log in",
            logout: "Log out",
            createAd: "Create ad",
            imageAlt: "Profile picture",
            toggleMenu: "Toggle menu",
        },
        filters: {
            positionTitle: "Position type",
            clear: "Clear filters",
            fullTime: "Full-time",
            partTime: "Part-time",
            internship: "Internship",
        },
    },
    sr: {
        language: {
            label: "Jezik",
            english: "Engleski",
            serbian: "Srpski",
        },
        common: {
            loading: "Ucitavanje...",
            back: "Nazad",
            cancel: "Odustani",
            save: "Sacuvaj",
            unsave: "Ukloni iz sacuvanih",
            report: "Prijavi",
            edit: "Izmeni",
            delete: "Obrisi",
            submit: "Potvrdi",
            search: "Pretrazi",
            email: "Email",
            phone: "Telefon",
            username: "Korisnicko ime",
            password: "Lozinka",
            confirmPassword: "Potvrdi lozinku",
            displayName: "Prikazano ime",
            salary: "Plata",
            description: "Opis",
            title: "Naziv",
        },
        home: {
            fetchFailed: "Neuspesno ucitavanje oglasa.",
            searchPlaceholder: "Pretraga...",
            loadingInitial: "Ucitavanje oglasa...",
            empty: "Nijedan oglas ne odgovara trenutnoj pretrazi i filterima.",
        },
        loginPage: {
            title: "Prijava",
            noAccount: "Nemate nalog?",
            register: "Registruj se",
            forgotPassword: "Zaboravljena lozinka",
        },
        registerPage: {
            title: "Registracija",
            alreadyHaveAccount: "Vec imate nalog?",
            login: "Prijavi se",
        },
        loginForm: {
            invalidCredentials: "Neispravno korisnicko ime ili lozinka.",
            loginFailed: "Prijava nije uspela, pokusajte ponovo.",
        },
        registerForm: {
            passwordsDontMatch: "Lozinke se ne poklapaju.",
            registering: "Registracija...",
            register: "Registruj se",
        },
        createAd: {
            pageTitle: "Kreiraj oglas",
            failedToCreate: "Kreiranje oglasa nije uspelo.",
            typeOfSalary: "Tip plate",
            workTime: "Radno vreme",
            positionType: "Pozicija",
            selectPosition: "Izaberi poziciju",
            address: "Adresa",
            banner: "Baner",
            monthly: "Mesecno",
            daily: "Dnevno",
            hourly: "Po satu",
            waiter: "Konobar",
            bartender: "Sanker",
            chef: "Kuvar",
            driver: "Vozac",
            truckDriver: "Kamiondzija",
            cashier: "Kasir",
            delivery: "Dostava",
            warehouseWorker: "Magacioner",
            janitor: "Domar",
            contactEmail: "Kontakt email",
            contactPhone: "Kontakt telefon",
            contactRequired: "Unesite i kontakt email i broj telefona.",
            creating: "Kreiranje...",
            createButton: "Kreiraj oglas",
        },
        adDetail: {
            failedLoad: "Neuspesno ucitavanje oglasa.",
            failedSaveToggle: "Promena stanja sacuvanog nije uspela.",
            failedSubmitReport: "Slanje prijave nije uspelo.",
            reportSubmitted: "Prijava je poslata.",
            confirmDelete: "Da li ste sigurni?",
            reportPrompt: "Zasto prijavljujete ovaj oglas?",
            loading: "Ucitavanje oglasa...",
            headerCaption: "Detalji oglasa",
            salaryNotSpecified: "Nije navedeno",
            postedBy: "Objavio",
            savedByUsers: "Sacuvan kod {{count}} korisnika",
            contactDetails: "Kontakt podaci",
            contactEmail: "Kontakt email",
            contactPhone: "Kontakt telefon",
            contactNotProvided: "Nije navedeno",
        },
        profile: {
            failedSave: "Cuvanje nije uspelo.",
            reportPrompt: "Zasto prijavljujete ovaj oglas?",
            reportSuccess: "Oglas je prijavljen.",
            failedReport: "Prijavljivanje nije uspelo.",
            reportProfile: "Prijavi profil",
            reportProfilePrompt: "Zasto prijavljujete ovaj profil?",
            reportProfileSuccess: "Profil je uspesno prijavljen.",
            reportProfileFailed: "Prijavljivanje profila nije uspelo.",
            confirmDelete: "Da li ste sigurni?",
            deleteFailed: "Brisanje nije uspelo.",
            failedFetchProfile: "Neuspesno ucitavanje profila.",
            notFound: "Profil nije pronadjen.",
            editProfile: "Izmeni profil",
            bio: "Opis",
            phone: "Telefon",
            advertisements: "Oglasi",
            noAdvertisements: "Jos nema oglasa.",
        },
        savedAds: {
            failedLoad: "Neuspesno ucitavanje sacuvanih oglasa.",
            title: "Sacuvani oglasi",
            empty: "Nemate sacuvane oglase.",
        },
        editAd: {
            failedLoad: "Neuspesno ucitavanje oglasa.",
            failedUpdate: "Azuriranje oglasa nije uspelo.",
            title: "Izmeni oglas",
            typeOfWorker: "Tip radnika",
            bannerImage: "Slika banera",
            saveChanges: "Sacuvaj izmene",
            subtitle: "Azurirajte detalje oglasa i kontakt podatke.",
            saving: "Cuvanje izmena...",
            updated: "Oglas je uspesno azuriran.",
            currentImage: "Trenutna slika banera",
        },
        editProfile: {
            title: "Izmeni profil",
            failedLoad: "Neuspesno ucitavanje profila.",
            updateFailed: "Azuriranje nije uspelo.",
            updated: "Profil je azuriran",
            bio: "Opis",
            phoneNumber: "Broj telefona",
            saving: "Cuvanje...",
            saveChanges: "Sacuvaj izmene",
            changePassword: "Promeni lozinku",
            deleteAccount: "Obrisi nalog",
        },
        auth: {
            resetPasswordTitle: "Resetuj lozinku.",
            resetPasswordRequestTitle: "Unesite email za reset lozinke",
            passwordsDoNotMatch: "Lozinke se ne poklapaju.",
            resetFailed: "Reset nije uspeo",
            resetSuccess: "Lozinka je uspesno resetovana.",
            newPassword: "Nova lozinka",
            resetting: "Resetovanje...",
            resetPassword: "Resetuj lozinku",
            emailSent: "Email je poslat.",
            sendFailed: "Doslo je do greske, pokusajte ponovo.",
            sending: "Slanje...",
            sendEmail: "Posalji email",
            logoutFailed: "Odjava nije uspela. Pokusajte ponovo.",
        },
        emailVerification: {
            notVerifiedTitle: "Email nije verifikovan",
            notVerifiedSubtitle: "Verifikujte email da biste nastavili",
            resend: "Posalji verifikaciju ponovo",
            failedResend: "Neuspesno ponovno slanje verifikacionog emaila",
            usernameRequired: "Prvo unesite korisnicko ime.",
            checkInbox: "Proverite email za verifikaciju.",
            goBack: "Vrati se",
            verifying: "Verifikacija...",
            verifiedCanLogin: "Email je verifikovan, sada mozete da se prijavite.",
            verificationFailed: "Verifikacija nije uspela",
            resendLink: "Ponovo posalji verifikacioni email",
        },
        notFound: {
            pageNotFound: "Stranica nije pronadjena",
        },
        sideMenu: {
            login: "Prijava",
            logout: "Odjava",
            createAd: "Kreiraj oglas",
            imageAlt: "Profilna slika",
            toggleMenu: "Otvori meni",
        },
        filters: {
            positionTitle: "Tip pozicije",
            clear: "Ocisti filtere",
            fullTime: "Puno radno vreme",
            partTime: "Nepuno radno vreme",
            internship: "Praksa",
        },
    },
};

const LanguageContext = createContext(null);

function getNestedValue(obj, key) {
    return key.split(".").reduce((acc, part) => acc?.[part], obj);
}

function applyParams(text, params = {}) {
    return text.replace(/\{\{(\w+)\}\}/g, (_, token) => {
        return params[token] ?? "";
    });
}

function resolveInitialLanguage() {
    if (typeof window === "undefined") {
        return "en";
    }
    const persisted = localStorage.getItem(STORAGE_KEY);
    if (persisted === "en" || persisted === "sr") {
        return persisted;
    }
    return navigator.language?.toLowerCase().startsWith("sr") ? "sr" : "en";
}

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(resolveInitialLanguage);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, language);
            document.documentElement.lang = language;
        }
    }, [language]);

    const value = useMemo(() => {
        const t = (key, params) => {
            const localized = getNestedValue(translations[language], key);
            const fallback = getNestedValue(translations.en, key);
            const text = typeof localized === "string"
                ? localized
                : typeof fallback === "string"
                    ? fallback
                    : key;
            return applyParams(text, params);
        };

        return {
            language,
            setLanguage,
            t,
        };
    }, [language]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) {
        throw new Error("useLanguage must be used inside LanguageProvider.");
    }
    return ctx;
}