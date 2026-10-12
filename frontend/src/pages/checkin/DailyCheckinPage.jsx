import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { checkinApi } from '../../api/checkinApi';

import ProgressIndicator from './components/ProgressIndicator';
import ActivitiesStep from './components/ActivitiesStep';
import MoodStep from './components/MoodStep';
import GoalsHabitsStep from './components/GoalsHabitsStep';
import ReflectionStep from './components/ReflectionStep';
import ReviewStep from './components/ReviewStep';
import CompletionStep from './components/CompletionStep';
import { ChevronRight, ChevronLeft, Save } from 'lucide-react';

const INITIAL_STATE = {
    activities: { study_hours: 0, work_hours: 0, exercise_minutes: 0, reading_minutes: 0, meditation_minutes: 0, sleep_hours: 0, water_intake_ml: 0, screen_time_minutes: 0, leisure_hours: 0, walking_steps: 0, calories_burned: 0 },
    mood: { mood_score: 5, intensity: 3, mood_label: '😐', note: '' },
    wellbeing: { energy_level: 3, stress_level: 3, focus_level: 3, motivation_level: 3 },
    journal: { title: '', content: '' },
    daily_rating: 0,
    is_completed: false
};

export default function CheckinWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [data, setData] = useState(INITIAL_STATE);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const totalSteps = 6;

    useEffect(() => {
        loadTodayCheckin();
    }, []);

    // Auto-Save Effect (Debounced saving)
    useEffect(() => {
        if (isLoading || currentStep === totalSteps) return; // Don't auto-save if loading or completed
        
        const timer = setTimeout(() => {
            saveDraft();
        }, 15000); // Auto-save every 15s of inactivity
        
        return () => clearTimeout(timer);
    }, [data, currentStep, isLoading]);

    const loadTodayCheckin = async () => {
        try {
            const response = await checkinApi.getToday();
            const checkinData = (response && response.data !== undefined) ? response.data : response;
            if (checkinData && typeof checkinData === 'object') {
                // Check if already completed today
                if (checkinData.is_completed) {
                    setData(checkinData);
                    setCurrentStep(totalSteps); // Jump to completion if already done
                } else if (checkinData.id || checkinData.activities) {
                    setData(prev => ({
                        ...prev, ...checkinData,
                        activities: { ...prev.activities, ...(checkinData.activities || {}) },
                        mood: { ...prev.mood, ...(checkinData.mood || {}) },
                        wellbeing: { ...prev.wellbeing, ...(checkinData.wellbeing || {}) },
                        journal: { ...prev.journal, ...(checkinData.journal || {}) },
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to load check-in:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveDraft = async () => {
        try {
            setIsSaving(true);
            await checkinApi.upsertCheckin({ ...data, is_completed: false });
            setLastSaved(new Date());
        } catch (error) {
            console.error("Auto-save failed", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinalSubmit = async () => {
        try {
            setIsSaving(true);
            await checkinApi.upsertCheckin({ ...data, is_completed: true });
            setCurrentStep(totalSteps);
        } catch (error) {
            console.error("Submission failed", error);
            alert("Failed to submit check-in. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const nextStep = () => {
        saveDraft(); // Save when moving forward
        if (currentStep < totalSteps - 1) setCurrentStep(c => c + 1);
        else if (currentStep === totalSteps - 1) handleFinalSubmit();
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(c => c - 1);
    };

    // State updaters passed to steps
    const updateActivity = (key, val) => setData(prev => ({ ...prev, activities: { ...prev.activities, [key]: Number(val) } }));
    const updateMood = (key, val) => setData(prev => ({ ...prev, mood: { ...prev.mood, [key]: val } }));
    const updateWellbeing = (key, val) => setData(prev => ({ ...prev, wellbeing: { ...prev.wellbeing, [key]: Number(val) } }));
    const updateJournal = (key, val) => setData(prev => ({ ...prev, journal: { ...prev.journal, [key]: val } }));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen text-slate-100 flex flex-col pb-24 md:pb-20">
            {currentStep < totalSteps && (
                <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps - 1} />
            )}

            <div className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-8">
                {currentStep < totalSteps && (
                    <div className="flex justify-end mb-4">
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            {isSaving ? (
                                <span className="animate-pulse">Saving...</span>
                            ) : lastSaved ? (
                                <span><Save className="w-3 h-3 inline mr-1"/> Draft saved at {lastSaved.toLocaleTimeString()}</span>
                            ) : null}
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {currentStep === 1 && <ActivitiesStep key="step1" data={data} updateActivity={updateActivity} />}
                    {currentStep === 2 && <MoodStep key="step2" data={data} updateMood={updateMood} updateWellbeing={updateWellbeing} />}
                    {currentStep === 3 && <GoalsHabitsStep key="step3" data={data} setData={setData} />}
                    {currentStep === 4 && <ReflectionStep key="step4" data={data} updateJournal={updateJournal} />}
                    {currentStep === 5 && <ReviewStep key="step5" data={data} setCurrentStep={setCurrentStep} />}
                    {currentStep === 6 && <CompletionStep key="step6" data={data} />}
                </AnimatePresence>

                {currentStep < totalSteps && (
                    <div className="flex justify-between items-center mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-white/10 gap-3">
                        <button 
                            onClick={prevStep}
                            disabled={currentStep === 1 || isSaving}
                            className={`flex items-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium text-xs sm:text-sm transition-colors ${
                                currentStep === 1 ? 'opacity-0 pointer-events-none' : 'hover:bg-white/10 text-gray-300 active:scale-95'
                            }`}
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Back
                        </button>
                        
                        <button 
                            onClick={nextStep}
                            disabled={isSaving}
                            className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95 transition-all"
                        >
                            <span>{currentStep === totalSteps - 1 ? 'Submit Check-in' : 'Continue'}</span> <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
