const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const numerologyProfileSchema = new mongoose.Schema(
  {
    psychic: Number,
    destiny: Number,
    nameNumber: Number,
    nameCorrectionSuggestions: [
      {
        name: String,
        score: Number,
        originalName: String,
        label: String,
        nameNumber: Number,
        destiny: Number,
        psychic: Number
      }
    ],
    luckyColors: [String],
    luckyDays: [String],
    interpretation: String,
    source: {
      fullName: String,
      dateOfBirth: String
    }
  },
  { _id: false }
);

const birthLocationSchema = new mongoose.Schema(
  {
    name: String,
    latitude: Number,
    longitude: Number
  },
  { _id: false }
);

const astrologySignSchema = new mongoose.Schema(
  {
    name: String,
    westernName: String,
    element: String,
    degrees: Number
  },
  { _id: false }
);

const astrologyProfileSchema = new mongoose.Schema(
  {
    ascendant: astrologySignSchema,
    birthRashi: astrologySignSchema,
    moonSign: astrologySignSchema,
    source: {
      dateOfBirth: String,
      birthTime: String,
      birthLocation: birthLocationSchema
    },
    calculationNotes: String
  },
  { _id: false }
);

const calculationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['profile', 'forecast', 'compatibility', 'loshu', 'cleanTrade', 'stockOutlook'],
      required: true
    },
    input: mongoose.Schema.Types.Mixed,
    result: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 120
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    dateOfBirth: {
      type: String,
      default: null
    },
    birthTime: {
      type: String,
      default: null
    },
    birthLocation: {
      type: birthLocationSchema,
      default: null
    },
    profile: {
      type: numerologyProfileSchema,
      default: null
    },
    astrologyProfile: {
      type: astrologyProfileSchema,
      default: null
    },
    lastCalculations: {
      type: [calculationSchema],
      default: []
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
