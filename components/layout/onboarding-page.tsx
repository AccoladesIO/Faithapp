"use client"

import React, { useState } from 'react';
import { User, BookOpen, Droplets, Briefcase, Info, CheckCircle2, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type OnboardingStep =
    | 'STEP_1_DEMOGRAPHICS'
    | 'STEP_2_SPIRITUAL'
    | 'STEP_3_BAPTISM'
    | 'STEP_4_WORKFORCE_INTENT'
    | 'STEP_5_TRAINING_NOTICE'
    | 'STEP_6_SUBMIT';

interface OnboardingFormData {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phoneNumber: string;
    gender: 'MALE' | 'FEMALE' | '';
    dateOfBirth: string;
    maritalStatus: 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'DIVORCED' | '';
    yearJoinedChurch: string;
    yearBornAgain: string;
    baptizedWithHolyGhost: boolean;
    yearBaptized: string;
    joinWorkforce: boolean;
}

const INITIAL_FORM_DATA: OnboardingFormData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    gender: '',
    dateOfBirth: '',
    maritalStatus: '',
    yearJoinedChurch: '',
    yearBornAgain: '',
    baptizedWithHolyGhost: false,
    yearBaptized: '',
    joinWorkforce: false,
};

export const OnboardingPage = () => {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('STEP_1_DEMOGRAPHICS');
    const [formData, setFormData] = useState<OnboardingFormData>(INITIAL_FORM_DATA);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'processing' | 'success'>('idle');

    const updateField = (field: keyof OnboardingFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (currentStep === 'STEP_1_DEMOGRAPHICS') {
            setCurrentStep('STEP_2_SPIRITUAL');
        } else if (currentStep === 'STEP_2_SPIRITUAL') {
            setCurrentStep('STEP_3_BAPTISM');
        } else if (currentStep === 'STEP_3_BAPTISM') {
            setCurrentStep('STEP_4_WORKFORCE_INTENT');
        } else if (currentStep === 'STEP_4_WORKFORCE_INTENT') {
            if (formData.joinWorkforce) {
                setCurrentStep('STEP_5_TRAINING_NOTICE');
            } else {
                setCurrentStep('STEP_6_SUBMIT');
            }
        } else if (currentStep === 'STEP_5_TRAINING_NOTICE') {
            setCurrentStep('STEP_6_SUBMIT');
        }
    };

    const handleBack = () => {
        if (currentStep === 'STEP_2_SPIRITUAL') {
            setCurrentStep('STEP_1_DEMOGRAPHICS');
        } else if (currentStep === 'STEP_3_BAPTISM') {
            setCurrentStep('STEP_2_SPIRITUAL');
        } else if (currentStep === 'STEP_4_WORKFORCE_INTENT') {
            setCurrentStep('STEP_3_BAPTISM');
        } else if (currentStep === 'STEP_5_TRAINING_NOTICE') {
            setCurrentStep('STEP_4_WORKFORCE_INTENT');
        } else if (currentStep === 'STEP_6_SUBMIT') {
            if (formData.joinWorkforce) {
                setCurrentStep('STEP_5_TRAINING_NOTICE');
            } else {
                setCurrentStep('STEP_4_WORKFORCE_INTENT');
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus('processing');

        const requiresAutoEnrollment = formData.joinWorkforce && (!formData.yearBaptized || !formData.baptizedWithHolyGhost);

        const payload = {
            ...formData,
            meta: {
                compiledTimestamp: new Date().toISOString(),
                autoEnrollmentQueued: requiresAutoEnrollment,
                assignedTracks: requiresAutoEnrollment ? ['FOUNDATIONAL_TRAINING', 'WORKFORCE_READY'] : []
            }
        };

        setTimeout(() => {
            console.log('HTTP_POST Payload Compiled:', JSON.stringify(payload, null, 2));
            setSubmitStatus('success');
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#121212] pb-32 font-sans selection:bg-[#121212] selection:text-[#FFFFFF]">

            <div className="relative w-full h-[20vh] overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1445108771252-d1cc31a02a3c?q=80&w=1200&auto=format&fit=crop"
                    alt="Sanctuary onboarding backdrop"
                    className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF]/20 to-transparent">
                    <span className="text-xs uppercase tracking-widest text-white/80 font-semibold drop-shadow-sm">
                        RCCG DISCOVERY CENTER Church
                    </span>
                    <h1 className="text-2xl font-light tracking-tight text-white mt-1 drop-shadow-md">
                        Membership Onboarding
                    </h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 mt-8">
                {submitStatus === 'idle' && (
                    <div className="space-y-6">

                        {currentStep === 'STEP_1_DEMOGRAPHICS' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-[#121212]/5 pb-2">
                                    <User size={16} className="text-[#8A817C]" />
                                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Step 1: Demographics</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">First Name</label>
                                        <input type="text" required value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)} className="w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121212]/30" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Last Name</label>
                                        <input type="text" required value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)} className="w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121212]/30" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Email Address</label>
                                    <input type="email" required value={formData.email} onChange={(e) => updateField('email', e.target.value)} className="w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121212]/30" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Password</label>
                                    <input type="password" required value={formData.password} onChange={(e) => updateField('password', e.target.value)} className="w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121212]/30" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Phone Number</label>
                                    <input type="tel" required value={formData.phoneNumber} onChange={(e) => updateField('phoneNumber', e.target.value)} className="w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121212]/30" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Gender</label>
                                        <select value={formData.gender} onChange={(e) => updateField('gender', e.target.value)} className="w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121212]/30 appearance-none">
                                            <option value="">Select...</option>
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Marital Status</label>
                                        <select value={formData.maritalStatus} onChange={(e) => updateField('maritalStatus', e.target.value)} className="w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121212]/30 appearance-none">
                                            <option value="">Select...</option>
                                            <option value="SINGLE">Single</option>
                                            <option value="MARRIED">Married</option>
                                            <option value="WIDOWED">Widowed</option>
                                            <option value="DIVORCED">Divorced</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Date of Birth</label>
                                    <input type="date" required value={formData.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} className="w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121212]/30" />
                                </div>
                            </div>
                        )}

                        {currentStep === 'STEP_2_SPIRITUAL' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-[#121212]/5 pb-2">
                                    <BookOpen size={16} className="text-[#8A817C]" />
                                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Step 2: Spiritual Foundation</h3>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Year You Joined RCCG</label>
                                    <input type="number" placeholder="YYYY" min="1900" max="2026" value={formData.yearJoinedChurch} onChange={(e) => updateField('yearJoinedChurch', e.target.value)} className="w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121212]/30" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Year You Got Born Again</label>
                                    <input type="number" placeholder="YYYY" min="1900" max="2026" value={formData.yearBornAgain} onChange={(e) => updateField('yearBornAgain', e.target.value)} className="w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121212]/30" />
                                </div>
                            </div>
                        )}

                        {currentStep === 'STEP_3_BAPTISM' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-[#121212]/5 pb-2">
                                    <Droplets size={16} className="text-[#8A817C]" />
                                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Step 3: Sacraments</h3>
                                </div>
                                <div className="bg-[#F4F1EA]/50 rounded-2xl p-4 border border-[#121212]/5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-medium text-[#121212]">Baptized with the Holy Ghost?</h4>
                                            <p className="text-xs text-gray-500 font-light mt-0.5">Evidence of speaking in unknown tongues</p>
                                        </div>
                                        <button type="button" onClick={() => updateField('baptizedWithHolyGhost', !formData.baptizedWithHolyGhost)} className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${formData.baptizedWithHolyGhost ? 'bg-[#8A817C]' : 'bg-gray-300'}`}>
                                            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${formData.baptizedWithHolyGhost ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block mb-1">Year Baptized by Water (Optional)</label>
                                    <input type="number" placeholder="Leave empty if not water baptized" min="1900" max="2026" value={formData.yearBaptized} onChange={(e) => updateField('yearBaptized', e.target.value)} className="w-full bg-[#F4F1EA]/40 border border-[#121212]/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#121212]/30" />
                                </div>
                            </div>
                        )}

                        {currentStep === 'STEP_4_WORKFORCE_INTENT' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-[#121212]/5 pb-2">
                                    <Briefcase size={16} className="text-[#8A817C]" />
                                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Step 4: Workforce Intent</h3>
                                </div>
                                <p className="text-sm text-gray-600 font-light leading-relaxed">
                                    Would you like to express interest in joining a church workforce department (e.g., Media, Ushers, Choir, Protocols)?
                                </p>
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button type="button" onClick={() => updateField('joinWorkforce', true)} className={`py-4 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all ${formData.joinWorkforce ? 'bg-[#121212] text-white border-transparent shadow-md' : 'bg-white text-gray-600 border-[#121212]/10 hover:border-[#121212]/20'}`}>
                                        Yes, I Want to Serve
                                    </button>
                                    <button type="button" onClick={() => updateField('joinWorkforce', false)} className={`py-4 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all ${!formData.joinWorkforce ? 'bg-[#121212] text-white border-transparent shadow-md' : 'bg-white text-gray-600 border-[#121212]/10 hover:border-[#121212]/20'}`}>
                                        No, Just a Member
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 'STEP_5_TRAINING_NOTICE' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-[#121212]/5 pb-2">
                                    <Info size={16} className="text-[#8A817C]" />
                                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Step 5: Training Evaluation</h3>
                                </div>
                                <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-100 space-y-3">
                                    <h4 className="text-sm font-medium text-amber-900">Auto-Enrollment Tracks Triggered</h4>
                                    <p className="text-xs text-amber-800 font-light leading-relaxed">
                                        Because you indicated interest in joining the workforce but lack a verified baptism history or Holy Ghost foundation flag, your payload will automatically trigger background enrollment tracks into our training programs.
                                    </p>
                                </div>
                            </div>
                        )}

                        {currentStep === 'STEP_6_SUBMIT' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-[#121212]/5 pb-2">
                                    <CheckCircle2 size={16} className="text-[#8A817C]" />
                                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Step 6: Review & Submit</h3>
                                </div>
                                <p className="text-sm text-gray-600 font-light leading-relaxed">
                                    All parameters collected successfully. Your data payload structure has been packaged for server submission.
                                </p>
                                <div className="bg-[#F9F9F9] border border-[#121212]/5 rounded-2xl p-4 space-y-2 text-xs font-light text-gray-600">
                                    <div className="flex justify-between"><span>Identity:</span><span className="font-normal text-[#121212]">{formData.firstName} {formData.lastName}</span></div>
                                    <div className="flex justify-between"><span>Email:</span><span className="font-normal text-[#121212]">{formData.email}</span></div>
                                    <div className="flex justify-between"><span>Role Context:</span><span className="font-normal text-[#121212]">{formData.joinWorkforce ? 'WORKER_TRACK' : 'MEMBER_ONLY'}</span></div>
                                </div>
                                <button type="button" onClick={handleSubmit} className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-4 rounded-xl hover:bg-gray-800 transition-colors shadow-md">
                                    Complete Signup
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-6 border-t border-[#121212]/5">
                            {currentStep !== 'STEP_1_DEMOGRAPHICS' ? (
                                <button type="button" onClick={handleBack} className="text-xs font-semibold text-gray-500 flex items-center gap-1 hover:text-[#121212] transition-colors">
                                    <ChevronLeft size={14} /> Back
                                </button>
                            ) : <div />}

                            {currentStep !== 'STEP_6_SUBMIT' && (
                                <button type="button" onClick={handleNext} className="text-xs font-semibold text-[#121212] flex items-center gap-1 bg-[#121212]/5 px-4 py-2 rounded-lg hover:bg-[#121212]/10 transition-colors">
                                    Next <ChevronRight size={14} />
                                </button>
                            )}
                        </div>

                    </div>
                )}

                {submitStatus === 'processing' && (
                    <div className="text-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#8A817C]" />
                        <h3 className="text-md uppercase tracking-widest text-gray-400 font-semibold">Account Creation</h3>
                        <p className="text-xs text-gray-400 font-light mt-1">Setting up your account...</p>
                    </div>
                )}

                {submitStatus === 'success' && (
                    <div className="text-center py-12 border border-[#121212]/5 rounded-3xl p-6 bg-[#F9F9F9] shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-xl font-normal tracking-tight mb-2">Account Created</h3>
                        <p className="text-sm text-gray-500 font-light mb-6">
                            Welcome to the RCCG DISCOVERY CENTER Church community!
                        </p>
                        <button onClick={() => {
                            router.push('/');
                        }} className="w-full bg-[#121212] text-white text-xs uppercase tracking-widest font-semibold py-3.5 rounded-xl hover:bg-gray-800 transition-colors">
                            Proceed to App Home
                        </button>
                    </div>
                )}
            </div>
            <div className="text-center mt-8 px-6">
                <p className="text-xs text-gray-400 font-light">
                    Already part of the family?{' '}
                    <button className="text-[#121212] font-semibold hover:underline" onClick={() => router.push('/login')}>
                        Sign In
                    </button>
                </p>
            </div>

        </div>
    );
};