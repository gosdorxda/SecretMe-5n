export type Locale = "id" | "en"

type Translation = {
  common: {
    popular: string
    login: string
    register: string
    logout: string
    dashboard: string
    language: string
  }
  home: {
    hero: {
      userCount: string
      title: string
      subtitle: string
      cta: string
    }
    testimonials: {
      title: string
      subtitle: string
      testimonial1: {
        name: string
        role: string
        text: string
      }
      testimonial2: {
        name: string
        role: string
        text: string
      }
      testimonial3: {
        name: string
        role: string
        text: string
      }
    }
    stats: {
      users: string
      messages: string
      satisfaction: string
      premium: string
    }
    premium: {
      badge: string
      title: string
      subtitle: string
      price: string
      discount: string
      savePercent: string
      oneTimePayment: string
      guarantee: string
      features: {
        username: string
        profilePhoto: string
        socialLinks: string
        notifications: string
        statistics: string
        publicReplies: string
        customThemes: string
        deleteMessages: string
        shareProfile: string
        noAds: string
        futureUpdates: string
      }
    }
  }
  login: {
    title: string
    subtitle: string
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    forgotPassword: string
    loginButton: string
    processingButton: string
    googleButton: string
    googleProcessingButton: string
    orDivider: string
    forgotPasswordLink: string
    noAccount: string
    registerLink: string
    loginSuccess: string
    loginSuccessMessage: string
    loginError: string
    invalidCredentials: string
    rateLimitError: string
    networkError: string
    attemptCount: string
    googleDisabled: string
    googleDisabledMessage: string
  }
  register: {
    title: string
    subtitle: string
    nameLabel: string
    namePlaceholder: string
    emailLabel: string
    emailPlaceholder: string
    passwordLabel: string
    passwordPlaceholder: string
    registerButton: string
    processingButton: string
    googleButton: string
    googleProcessingButton: string
    orDivider: string
    haveAccount: string
    loginLink: string
    registerSuccess: string
    registerSuccessMessage: string
    registerError: string
    emailExistsError: string
    emailExistsAuthError: string
    networkError: string
    googleDisabled: string
    googleDisabledMessage: string
  }
  forgotPassword: {
    title: string
    subtitle: string
    emailLabel: string
    emailPlaceholder: string
    submitButton: string
    processingButton: string
    backToLogin: string
    successTitle: string
    successMessage: string
    checkSpam: string
    tryAgainButton: string
    backToLoginButton: string
    emailRequired: string
    emailNotRegistered: string
    resetEmailSent: string
    resetEmailSentMessage: string
    resetEmailError: string
    resetEmailErrorMessage: string
    infoMessage: string
  }
}

export const translations: Record<Locale, Translation> = {
  id: {
    common: {
      popular: "Populer",
      login: "Masuk",
      register: "Daftar",
      logout: "Keluar",
      dashboard: "Dashboard",
      language: "Bahasa",
    },
    home: {
      hero: {
        userCount: "30.000+ pengguna sudah bergabung!",
        title: "Terima Pesan Anonim dari Siapapun",
        subtitle:
          "Platform untuk menerima pesan dan umpan balik secara anonim. Dapatkan kejujuran dari teman dan rekan kerja Anda.",
        cta: "Buat!",
      },
      testimonials: {
        title: "Ulasan Pengguna",
        subtitle: "Lihat apa kata pengguna tentang pengalaman mereka menggunakan Secretme",
        testimonial1: {
          name: "Dian Pratama",
          role: "Influencer",
          text: '"Secretme membantu saya mendapatkan feedback jujur dari followers. Fitur premium worth it dengan notifikasi yang memudahkan respon cepat!"',
        },
        testimonial2: {
          name: "Rini Sulistiani",
          role: "Manajer HR",
          text: '"Kami gunakan Secretme untuk feedback anonim karyawan. Hasilnya luar biasa! Banyak masalah tersembunyi akhirnya terungkap."',
        },
        testimonial3: {
          name: "Fajar Aditya",
          role: "Content Creator",
          text: '"Game changer untuk konten saya! Dapat ide baru dari pesan anonim dan fitur link sosmed sangat membantu cross-promotion."',
        },
      },
      stats: {
        users: "Pengguna Terdaftar",
        messages: "Pesan Terkirim",
        satisfaction: "Kepuasan Pengguna",
        premium: "Pengguna Premium",
      },
      premium: {
        badge: "PENAWARAN SPESIAL",
        title: "Sekali Bayar, Akses Premium Selamanya!",
        subtitle:
          "Dapatkan akses ke semua fitur premium Secretme dengan pembayaran satu kali. Tanpa biaya berlangganan bulanan!",
        price: "Rp 16.500",
        discount: "Rp 49.000",
        savePercent: "Hemat 38%",
        oneTimePayment: "Pembayaran sekali, akses seumur hidup ke semua fitur premium",
        guarantee: "Garansi 30 hari uang kembali. Tanpa risiko!",
        features: {
          username: "Username kustom permanen selamanya",
          profilePhoto: "Foto profil kustom & bio lengkap",
          socialLinks: "Link media sosial (Instagram, Twitter, dll)",
          notifications: "Notifikasi WhatsApp & Telegram tanpa batas",
          statistics: "Statistik lengkap kunjungan & pesan",
          publicReplies: "Manajemen balasan publik",
          customThemes: "Tema profil kustom & kartu pesan",
          deleteMessages: "Hapus pesan yang tidak diinginkan",
          shareProfile: "Berbagi gambar profil dengan QR code",
          noAds: "Tanpa iklan & prioritas dukungan seumur hidup",
          futureUpdates: "Semua update fitur premium di masa depan",
        },
      },
    },
    login: {
      title: "Masuk untuk melanjutkan",
      subtitle: "Lanjutkan perjalanan komunikasi anonim Anda",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      forgotPassword: "Lupa password?",
      loginButton: "Login",
      processingButton: "Memproses...",
      googleButton: "Masuk dengan Google",
      googleProcessingButton: "Memproses...",
      orDivider: "ATAU",
      forgotPasswordLink: "Lupa Password?",
      noAccount: "Belum punya akun?",
      registerLink: "Daftar",
      loginSuccess: "Login berhasil",
      loginSuccessMessage: "Selamat datang kembali!",
      loginError: "Login gagal",
      invalidCredentials: "Email atau password salah",
      rateLimitError: "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
      networkError: "Masalah koneksi internet. Periksa koneksi Anda dan coba lagi.",
      attemptCount: "Percobaan ke-",
      googleDisabled: "Login dengan Google dinonaktifkan",
      googleDisabledMessage:
        "Karena limit API, pendaftaran via Google dimatikan sementara, silahkan daftar secara manual.",
    },
    register: {
      title: "Daftar untuk memulai",
      subtitle: "Buat akun untuk mulai menerima pesan anonim",
      nameLabel: "Nama",
      namePlaceholder: "Nama Lengkap",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      registerButton: "Pendaftaran",
      processingButton: "Memproses...",
      googleButton: "Daftar dengan Google",
      googleProcessingButton: "Memproses...",
      orDivider: "ATAU",
      haveAccount: "Sudah punya akun?",
      loginLink: "Masuk",
      registerSuccess: "Pendaftaran berhasil",
      registerSuccessMessage: "Selamat datang di SecretMe!",
      registerError: "Pendaftaran gagal",
      emailExistsError: "Email sudah terdaftar. Silakan gunakan email lain atau login dengan email ini",
      emailExistsAuthError:
        "Email ini sudah terdaftar tetapi mungkin telah dihapus dari sistem autentikasi. Silakan hubungi admin atau gunakan email lain.",
      networkError: "Terjadi kesalahan saat mendaftar",
      googleDisabled: "Pendaftaran dengan Google dinonaktifkan",
      googleDisabledMessage:
        "Karena limit API, pendaftaran via Google dimatikan sementara, silahkan daftar secara manual.",
    },
    forgotPassword: {
      title: "Lupa Password",
      subtitle: "Masukkan email Anda untuk menerima link reset password",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      submitButton: "Kirim Link Reset",
      processingButton: "Mengirim...",
      backToLogin: "Kembali ke halaman login",
      successTitle: "Email Terkirim!",
      successMessage:
        "Kami telah mengirimkan instruksi reset password ke email Anda. Silakan periksa kotak masuk Anda.",
      checkSpam: "Tidak menerima email? Periksa folder spam atau coba lagi dalam beberapa menit.",
      tryAgainButton: "Coba Lagi",
      backToLoginButton: "Kembali ke Login",
      emailRequired: "Email diperlukan",
      emailNotRegistered: "Alamat email yang Anda masukkan tidak terdaftar di sistem kami",
      resetEmailSent: "Email terkirim",
      resetEmailSentMessage: "Silakan periksa email Anda untuk instruksi reset password",
      resetEmailError: "Gagal mengirim email reset",
      resetEmailErrorMessage: "Terjadi kesalahan saat mengirim email reset password",
      infoMessage: "Kami akan mengirimkan link reset password ke alamat email yang terdaftar di sistem kami.",
    },
  },
  en: {
    common: {
      popular: "Popular",
      login: "Login",
      register: "Register",
      logout: "Logout",
      dashboard: "Dashboard",
      language: "Language",
    },
    home: {
      hero: {
        userCount: "30,000+ users have joined!",
        title: "Receive Anonymous Messages from Anyone",
        subtitle:
          "A platform to receive anonymous messages and feedback. Get honest opinions from your friends and colleagues.",
        cta: "Create!",
      },
      testimonials: {
        title: "User Reviews",
        subtitle: "See what users say about their experience using Secretme",
        testimonial1: {
          name: "Dian Pratama",
          role: "Influencer",
          text: '"Secretme helps me get honest feedback from followers. The premium features are worth it with notifications that make quick responses easy!"',
        },
        testimonial2: {
          name: "Rini Sulistiani",
          role: "HR Manager",
          text: '"We use Secretme for anonymous employee feedback. The results are amazing! Many hidden issues finally came to light."',
        },
        testimonial3: {
          name: "Fajar Aditya",
          role: "Content Creator",
          text: '"Game changer for my content! I get new ideas from anonymous messages and the social media link feature helps with cross-promotion."',
        },
      },
      stats: {
        users: "Registered Users",
        messages: "Messages Sent",
        satisfaction: "User Satisfaction",
        premium: "Premium Users",
      },
      premium: {
        badge: "SPECIAL OFFER",
        title: "Pay Once, Premium Access Forever!",
        subtitle: "Get access to all Secretme premium features with a one-time payment. No monthly subscription fees!",
        price: "Rp 16,500",
        discount: "Rp 49,000",
        savePercent: "Save 38%",
        oneTimePayment: "One-time payment, lifetime access to all premium features",
        guarantee: "30-day money-back guarantee. No risk!",
        features: {
          username: "Permanent custom username forever",
          profilePhoto: "Custom profile photo & complete bio",
          socialLinks: "Social media links (Instagram, Twitter, etc.)",
          notifications: "Unlimited WhatsApp & Telegram notifications",
          statistics: "Complete visit & message statistics",
          publicReplies: "Public reply management",
          customThemes: "Custom profile themes & message cards",
          deleteMessages: "Delete unwanted messages",
          shareProfile: "Share profile image with QR code",
          noAds: "No ads & lifetime priority support",
          futureUpdates: "All future premium feature updates",
        },
      },
    },
    login: {
      title: "Login to continue",
      subtitle: "Continue your anonymous communication journey",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      forgotPassword: "Forgot password?",
      loginButton: "Login",
      processingButton: "Processing...",
      googleButton: "Login with Google",
      googleProcessingButton: "Processing...",
      orDivider: "OR",
      forgotPasswordLink: "Forgot Password?",
      noAccount: "Don't have an account?",
      registerLink: "Register",
      loginSuccess: "Login successful",
      loginSuccessMessage: "Welcome back!",
      loginError: "Login failed",
      invalidCredentials: "Email or password is incorrect",
      rateLimitError: "Too many login attempts. Please try again later.",
      networkError: "Internet connection issue. Check your connection and try again.",
      attemptCount: "Attempt #",
      googleDisabled: "Google login disabled",
      googleDisabledMessage:
        "Due to API limits, Google registration is temporarily disabled, please register manually.",
    },
    register: {
      title: "Register to get started",
      subtitle: "Create an account to start receiving anonymous messages",
      nameLabel: "Name",
      namePlaceholder: "Full Name",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      registerButton: "Register",
      processingButton: "Processing...",
      googleButton: "Register with Google",
      googleProcessingButton: "Processing...",
      orDivider: "OR",
      haveAccount: "Already have an account?",
      loginLink: "Login",
      registerSuccess: "Registration successful",
      registerSuccessMessage: "Welcome to SecretMe!",
      registerError: "Registration failed",
      emailExistsError: "Email already registered. Please use another email or login with this one",
      emailExistsAuthError:
        "This email is already registered but may have been removed from the authentication system. Please contact admin or use another email.",
      networkError: "An error occurred during registration",
      googleDisabled: "Google registration disabled",
      googleDisabledMessage:
        "Due to API limits, Google registration is temporarily disabled, please register manually.",
    },
    forgotPassword: {
      title: "Forgot Password",
      subtitle: "Enter your email to receive a password reset link",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      submitButton: "Send Reset Link",
      processingButton: "Sending...",
      backToLogin: "Back to login page",
      successTitle: "Email Sent!",
      successMessage: "We have sent password reset instructions to your email. Please check your inbox.",
      checkSpam: "Didn't receive the email? Check your spam folder or try again in a few minutes.",
      tryAgainButton: "Try Again",
      backToLoginButton: "Back to Login",
      emailRequired: "Email is required",
      emailNotRegistered: "The email address you entered is not registered in our system",
      resetEmailSent: "Email sent",
      resetEmailSentMessage: "Please check your email for password reset instructions",
      resetEmailError: "Failed to send reset email",
      resetEmailErrorMessage: "An error occurred while sending the password reset email",
      infoMessage: "We will send a password reset link to the email address registered in our system.",
    },
  },
}

export type Translations = typeof translations.id
