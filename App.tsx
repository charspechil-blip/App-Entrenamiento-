
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ExerciseLog, Cluster, Goals, UserProfile, RoutineType, UserRoutine, RoutineFocus, ExerciseName, RestSettings, SavedRoutine, TrainingType } from './types';
import { SetupWizard } from './components/SetupWizard';
import { Dashboard } from './components/Dashboard';
import { HistoryScreen } from './components/HistoryScreen';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PREDEFINED_EXERCISES } from './constants/exercises';
import { SaveRoutineModal } from './components/SaveRoutineModal';
import { generateUUID } from './utils/uuid';
import { safeStorage } from './utils/storage';

// Custom hook declared at module level for stable React hook rules
const useDebouncedSave = (key: string, value: any, profileId: string | null, enabled: boolean) => {
    useEffect(() => {
        if (!enabled || !profileId) return;
        // Do not store null or undefined as literal strings in storage
        if (value === null || value === undefined) return;
        const handler = setTimeout(() => {
            try {
                safeStorage.setItem(`${key}_${profileId}`, JSON.stringify(value));
            } catch (error) {
                console.error(`Failed to save ${key} to storage:`, error);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [key, value, profileId, enabled]);
};

// Safe helpers to read storage synchronously on component creation
const getInitialProfiles = (): UserProfile[] => {
    try {
        const profilesStr = safeStorage.getItem('userProfiles');
        return profilesStr ? JSON.parse(profilesStr) : [];
    } catch {
        return [];
    }
};

const getInitialSavedRoutines = (): SavedRoutine[] => {
    try {
        const routinesStr = safeStorage.getItem('savedRoutines');
        return routinesStr ? JSON.parse(routinesStr) : [];
    } catch {
        return [];
    }
};

const getInitialActiveProfile = (_profiles: UserProfile[]): UserProfile | null => {
    // La pantalla inicial siempre debe ser la pantalla de selección de perfil (WelcomeScreen)
    return null;
};

const App: React.FC = () => {
    const initialProfiles = useMemo(() => getInitialProfiles(), []);
    const initialSavedRoutines = useMemo(() => getInitialSavedRoutines(), []);
    const initialActiveProfile = useMemo(() => getInitialActiveProfile(initialProfiles), [initialProfiles]);

    const [allProfiles, setAllProfiles] = useState<UserProfile[]>(initialProfiles);
    const [activeProfile, setActiveProfile] = useState<UserProfile | null>(initialActiveProfile);
    const [savedRoutines, setSavedRoutines] = useState<SavedRoutine[]>(initialSavedRoutines);

    const [logs, setLogs] = useState<ExerciseLog[]>(() => {
        if (!initialActiveProfile) return [];
        try {
            const logsStr = safeStorage.getItem(`exerciseLogs_${initialActiveProfile.id}`);
            const loadedLogs: ExerciseLog[] = logsStr ? JSON.parse(logsStr) : [];
            loadedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return loadedLogs;
        } catch {
            return [];
        }
    });

    const [goals, setGoals] = useState<Goals>(() => {
        if (!initialActiveProfile) return {};
        try {
            const goalsStr = safeStorage.getItem(`exerciseGoals_${initialActiveProfile.id}`);
            return goalsStr ? JSON.parse(goalsStr) : {};
        } catch {
            return {};
        }
    });

    const [userRoutine, setUserRoutine] = useState<UserRoutine | null>(() => {
        if (!initialActiveProfile) return null;
        try {
            const routineStr = safeStorage.getItem(`userRoutine_${initialActiveProfile.id}`);
            if (routineStr) {
                const parsed = JSON.parse(routineStr);
                if (parsed && typeof parsed === 'object' && parsed.type) {
                    return {
                        type: parsed.type || 'Calistenia',
                        focus: parsed.focus || 'Mixto',
                        exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
                        equipment: Array.isArray(parsed.equipment) ? parsed.equipment : initialActiveProfile.availableEquipment
                    };
                }
            }
        } catch {}
        return null;
    });

    const [restSettings, setRestSettings] = useState<RestSettings>(() => {
        if (!initialActiveProfile) {
            return { restBetweenSets: 60, restBetweenExercises: 180, mode: 'auto' };
        }
        try {
            const restStr = safeStorage.getItem(`restSettings_${initialActiveProfile.id}`);
            return restStr ? JSON.parse(restStr) : { restBetweenSets: 60, restBetweenExercises: 180, mode: 'auto' };
        } catch {
            return { restBetweenSets: 60, restBetweenExercises: 180, mode: 'auto' };
        }
    });

    const [trainingType, setTrainingType] = useState<TrainingType>('Normal');

    const [showHistory, setShowHistory] = useState(false);
    const [isReconfiguring, setIsReconfiguring] = useState(false);
    const [needsInitialSetup, setNeedsInitialSetup] = useState<boolean>(initialProfiles.length === 0);
    const [wizardStartStep, setWizardStartStep] = useState(1);
    
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    
    // Keep profiles and saved routines persisted
    useEffect(() => {
        try {
            safeStorage.setItem('userProfiles', JSON.stringify(allProfiles));
        } catch (e) {
            console.error('Failed to save userProfiles:', e);
        }
    }, [allProfiles]);

    useEffect(() => {
        try {
            safeStorage.setItem('savedRoutines', JSON.stringify(savedRoutines));
        } catch (e) {
            console.error('Failed to save savedRoutines:', e);
        }
    }, [savedRoutines]);

const sanitizeLogs = (rawLogs: any[]): ExerciseLog[] => {
    if (!Array.isArray(rawLogs)) return [];
    return rawLogs.filter(Boolean).map(log => {
        let clusters: Cluster[] = Array.isArray(log?.clusters)
            ? log.clusters.map((c: any) => ({
                weight: Number(c?.weight) || 0,
                reps: Number(c?.reps) || 0,
                time: c?.time !== undefined ? Number(c.time) || 0 : undefined
            }))
            : [];

        if (clusters.length === 0 && (log?.weight !== undefined || log?.reps !== undefined || log?.time !== undefined)) {
            clusters.push({
                weight: Number(log.weight) || 0,
                reps: Number(log.reps) || 0,
                time: log.time !== undefined ? Number(log.time) : undefined
            });
        }

        return {
            id: log?.id || generateUUID(),
            exerciseName: log?.exerciseName || 'Ejercicio',
            timestamp: log?.timestamp || new Date().toISOString(),
            clusters,
            heartRate: log?.heartRate ? Number(log.heartRate) : undefined,
            perceivedExertion: log?.perceivedExertion ? Number(log.perceivedExertion) : undefined,
            notes: log?.notes
        };
    });
};

    // Load logs only when activeProfile changes to prevent race conditions
    useEffect(() => {
        if (!activeProfile) return;
        try {
            const logsStr = safeStorage.getItem(`exerciseLogs_${activeProfile.id}`);
            const rawLogs: any[] = logsStr ? JSON.parse(logsStr) : [];
            const loadedLogs = sanitizeLogs(rawLogs);
            loadedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setLogs(loadedLogs);
        } catch (error) {
            console.error(`Failed to load logs for profile ${activeProfile.id}:`, error);
            setLogs([]);
        }
    }, [activeProfile]);

    // Load other settings based on more complex dependencies
    useEffect(() => {
        if (!activeProfile) return;

        // Conditional loading to not overwrite settings during an active session or reconfiguration
        if (!sessionStartTime) {
            try {
                const goalsStr = safeStorage.getItem(`exerciseGoals_${activeProfile.id}`);
                setGoals(goalsStr ? JSON.parse(goalsStr) : {});
                
                if (!isReconfiguring) {
                    const routineStr = safeStorage.getItem(`userRoutine_${activeProfile.id}`);
                    if (routineStr) {
                        try {
                            const parsed = JSON.parse(routineStr);
                            if (parsed && typeof parsed === 'object' && parsed.type) {
                                setUserRoutine({
                                    type: parsed.type || 'Calistenia',
                                    focus: parsed.focus || 'Mixto',
                                    exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
                                    equipment: Array.isArray(parsed.equipment) ? parsed.equipment : activeProfile.availableEquipment
                                });
                            } else {
                                setUserRoutine(null);
                            }
                        } catch {
                            setUserRoutine(null);
                        }
                    } else {
                        setUserRoutine(null);
                    }
                }
                
                const restStr = safeStorage.getItem(`restSettings_${activeProfile.id}`);
                setRestSettings(restStr ? JSON.parse(restStr) : { restBetweenSets: 60, restBetweenExercises: 180, mode: 'auto' });
            } catch (error) {
                console.error(`Failed to load settings for profile ${activeProfile.id}:`, error);
            }
        }
    }, [activeProfile, isReconfiguring, sessionStartTime]);

    // Save data when it changes
    useDebouncedSave('exerciseLogs', logs, activeProfile?.id || null, !!activeProfile);
    useDebouncedSave('exerciseGoals', goals, activeProfile?.id || null, !!activeProfile);
    useDebouncedSave('userRoutine', userRoutine, activeProfile?.id || null, !!activeProfile);
    useDebouncedSave('restSettings', restSettings, activeProfile?.id || null, !!activeProfile);

    const handleLogin = (profileId: string) => {
        let profile = allProfiles.find(p => p.id === profileId);
        if (!profile) {
            const stored = getInitialProfiles();
            profile = stored.find(p => p.id === profileId);
        }
        if (profile) {
            setActiveProfile(profile);
            safeStorage.setItem('activeProfileId', profileId);
            setSessionStartTime(null);
            return profile;
        }
        return null;
    };

    const handleSelectProfile = (profileId: string) => {
        const profile = handleLogin(profileId);
        if (!profile) return;
        setShowHistory(false);
        setSessionStartTime(null);
        
        let loadedRoutine: UserRoutine | null = null;
        try {
            const routineStr = safeStorage.getItem(`userRoutine_${profileId}`);
            if (routineStr) {
                const parsed = JSON.parse(routineStr);
                if (parsed && typeof parsed === 'object') {
                    loadedRoutine = {
                        type: parsed.type || 'Calistenia',
                        focus: parsed.focus || 'Mixto',
                        exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
                        equipment: Array.isArray(parsed.equipment) ? parsed.equipment : profile.availableEquipment
                    };
                }
            }
        } catch (e) {
            console.error('Failed to load profile details:', e);
        }

        setUserRoutine(loadedRoutine);

        try {
            const goalsStr = safeStorage.getItem(`exerciseGoals_${profileId}`);
            setGoals(goalsStr ? JSON.parse(goalsStr) : {});
        } catch {
            setGoals({});
        }

        try {
            const restStr = safeStorage.getItem(`restSettings_${profileId}`);
            if (restStr) {
                const parsedRest = JSON.parse(restStr);
                setRestSettings({
                    restBetweenSets: Number(parsedRest.restBetweenSets) || 60,
                    restBetweenExercises: Number(parsedRest.restBetweenExercises) || 180,
                    mode: parsedRest.mode === 'manual' ? 'manual' : 'auto'
                });
            } else {
                setRestSettings({ restBetweenSets: 60, restBetweenExercises: 180, mode: 'auto' });
            }
        } catch {
            setRestSettings({ restBetweenSets: 60, restBetweenExercises: 180, mode: 'auto' });
        }

        // Si el usuario aún no tiene una rutina con ejercicios configurada,
        // lo llevamos de inmediato al Paso 2 para configurar su rutina de forma guiada
        if (!loadedRoutine || !Array.isArray(loadedRoutine.exercises) || loadedRoutine.exercises.length === 0) {
            setIsReconfiguring(true);
            setNeedsInitialSetup(false);
            setWizardStartStep(2);
        } else {
            setIsReconfiguring(false);
            setNeedsInitialSetup(false);
        }
    };

    const handleStartNewRoutine = (profileId: string) => {
        const profile = handleLogin(profileId);
        if (!profile) return;
        setUserRoutine(null);
        setGoals({});
        setNeedsInitialSetup(false);
        setIsReconfiguring(true);
        setWizardStartStep(2);
        setShowHistory(false);
    };

    const handleStartSavedRoutine = (profileId: string, routine: SavedRoutine) => {
        handleLogin(profileId);
        setUserRoutine({ type: 'Personalizado', focus: 'Mixto', exercises: Array.isArray(routine.exercises) ? routine.exercises : [] });
        setGoals(routine.goals || {});
        setRestSettings(routine.restSettings);
        setTrainingType(routine.trainingType);
        setSessionStartTime(null);
        setIsReconfiguring(false);
        setNeedsInitialSetup(false);
    };
    
    const handleViewHistory = (profileId: string) => {
        handleLogin(profileId);
        setShowHistory(true);
    };
    
    const handleReturnToDashboard = useCallback(() => {
        // Reset the state of the current active session to provide a clean slate
        setSessionStartTime(null);
        setUserRoutine(null);
        setGoals({});
        setTrainingType('Normal');
        
        // Navigate back to the dashboard view
        setShowHistory(false);
    }, []);

    const handleLogout = useCallback(() => {
        setActiveProfile(null);
        safeStorage.removeItem('activeProfileId');
        setLogs([]);
        setGoals({});
        setUserRoutine(null);
        setShowHistory(false);
        setSessionStartTime(null);
        setIsReconfiguring(false);
        setNeedsInitialSetup(allProfiles.length === 0);
    }, [allProfiles]);
    
    const handleCreateProfile = useCallback(() => {
        setNeedsInitialSetup(true);
        setIsReconfiguring(false);
        setActiveProfile(null);
        setWizardStartStep(1);
    }, []);
    
    const handleDeleteProfile = useCallback((profileId: string) => {
        if(window.confirm("¿Estás seguro de que quieres eliminar este perfil y todos sus datos? Esta acción no se puede deshacer.")) {
            const newProfiles = allProfiles.filter(p => p.id !== profileId);
            setAllProfiles(newProfiles);
            setSavedRoutines(prev => prev.filter(r => r.profileId !== profileId));
            safeStorage.removeItem(`exerciseLogs_${profileId}`);
            safeStorage.removeItem(`exerciseGoals_${profileId}`);
            safeStorage.removeItem(`userRoutine_${profileId}`);
            safeStorage.removeItem(`restSettings_${profileId}`);
            if (activeProfile?.id === profileId) {
                handleLogout();
            }
        }
    }, [activeProfile, handleLogout, allProfiles]);

    const handleCompleteWizard = useCallback((
        profileData: Omit<UserProfile, 'id'>, 
        routine: RoutineType, 
        focus: RoutineFocus, 
        exercises: ExerciseName[],
        favoriteExercises: ExerciseName[],
        aiConfig?: {
            trainingType: TrainingType;
            restSettings: RestSettings;
            goals: Goals;
        },
        equipment?: string[]
    ) => {
        let updatedProfile: UserProfile;
        const profilePayload = { 
          ...profileData, 
          favoriteExercises,
          availableEquipment: equipment || profileData.availableEquipment 
        };

        if (isReconfiguring && activeProfile) {
            updatedProfile = { ...activeProfile, ...profilePayload };
            setAllProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
        } else {
            updatedProfile = { id: generateUUID(), ...profilePayload };
            setAllProfiles(prev => [...prev, updatedProfile]);
            setLogs([]);
        }
        
        const rawPredefined = PREDEFINED_EXERCISES[routine]?.[focus] || [];
        const finalExercises = Array.isArray(exercises) && exercises.length > 0 ? exercises : rawPredefined;
        const newRoutine: UserRoutine = { type: routine, focus, exercises: finalExercises, equipment };

        setUserRoutine(newRoutine);

        if (aiConfig) {
            setTrainingType(aiConfig.trainingType);
            setRestSettings(aiConfig.restSettings);
            setGoals(aiConfig.goals);
        } else {
            // Reset to default if no AI config is provided (manual completion)
            setGoals({});
            setRestSettings({ restBetweenSets: 60, restBetweenExercises: 180, mode: 'auto' });
            setTrainingType('Normal');
        }

        try {
            safeStorage.setItem(`userRoutine_${updatedProfile.id}`, JSON.stringify(newRoutine));
        } catch (error) {
            console.error("Failed to save new routine immediately:", error);
        }
        
        safeStorage.setItem('activeProfileId', updatedProfile.id);
        setActiveProfile(updatedProfile);
        setSessionStartTime(null);
        
        setNeedsInitialSetup(false);
        setIsReconfiguring(false);
        setShowHistory(false);
    }, [isReconfiguring, activeProfile]);

    const handleStartWorkoutSession = useCallback(() => {
        setSessionStartTime(new Date());
    }, []);

    const handleGoToSettings = useCallback(() => {
        setIsReconfiguring(true);
        setWizardStartStep(1);
    }, []);
    
    const handleEditTodaysRoutine = useCallback(() => {
        setIsReconfiguring(true);
        if (!userRoutine || !userRoutine.type || !userRoutine.focus || !Array.isArray(userRoutine.exercises) || userRoutine.exercises.length === 0) {
            setWizardStartStep(2); 
        } else {
            setWizardStartStep(3);
        }
    }, [userRoutine]);
    
    const handleGoToRoutineSelection = useCallback(() => {
        setIsReconfiguring(true);
        setWizardStartStep(2);
    }, []);

    const handleLogExercise = useCallback((logData: Omit<ExerciseLog, 'id' | 'timestamp'>) => {
        setSessionStartTime(prev => prev || new Date());
        const newLog: ExerciseLog = {
            id: generateUUID(),
            timestamp: new Date().toISOString(),
            ...logData
        };
        setLogs(prev => [...prev, newLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }, []);

    const handleUpdateExerciseLog = useCallback((exerciseName: ExerciseName, clusters: Cluster[], notes?: string) => {
        setSessionStartTime(prev => prev || new Date());
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const sessionCutoff = sessionStartTime || startOfToday;

        setLogs(prev => {
            const existingIdx = prev.findIndex(l => 
                l.exerciseName === exerciseName && new Date(l.timestamp) >= sessionCutoff
            );

            if (clusters.length === 0) {
                if (existingIdx !== -1) {
                    return prev.filter((_, idx) => idx !== existingIdx);
                }
                return prev;
            }

            if (existingIdx !== -1) {
                const updated = [...prev];
                updated[existingIdx] = {
                    ...updated[existingIdx],
                    clusters,
                    notes: notes !== undefined ? notes : updated[existingIdx].notes,
                    timestamp: new Date().toISOString()
                };
                return updated;
            } else {
                const newLog: ExerciseLog = {
                    id: generateUUID(),
                    exerciseName,
                    timestamp: new Date().toISOString(),
                    clusters,
                    notes
                };
                return [newLog, ...prev];
            }
        });
    }, [sessionStartTime]);
    
    const handleAddLogs = useCallback((logsToAdd: ExerciseLog[]) => {
        setLogs(prev => 
            [...prev, ...logsToAdd].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        );
    }, []);

    const handleSaveRoutine = useCallback((name: string) => {
        if (!activeProfile || !userRoutine) return;
        const newSavedRoutine: SavedRoutine = {
            id: generateUUID(),
            profileId: activeProfile.id,
            name,
            exercises: Array.isArray(userRoutine.exercises) ? userRoutine.exercises : [],
            goals,
            restSettings,
            trainingType,
        };
        setSavedRoutines(prev => [...prev, newSavedRoutine]);
    }, [activeProfile, userRoutine, goals, restSettings, trainingType]);
    
    const handleDeleteRoutine = useCallback((routineId: string) => {
        if(window.confirm("¿Estás seguro de que quieres eliminar esta rutina guardada?")) {
            setSavedRoutines(prev => prev.filter(r => r.id !== routineId));
        }
    }, []);
    
    const handleSaveManualLog = useCallback((
        wizardProfileData: Omit<UserProfile, 'id'> | null,
        logsToAdd: ExerciseLog[]
    ) => {
        if (!isReconfiguring && wizardProfileData) {
            const newProfile: UserProfile = { id: generateUUID(), ...wizardProfileData };
            setAllProfiles(prev => [...prev, newProfile]);
            
            const defaultRoutine: UserRoutine = { type: 'Personalizado', focus: 'Mixto', exercises: [] };
            const sortedLogs = logsToAdd.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            safeStorage.setItem(`userRoutine_${newProfile.id}`, JSON.stringify(defaultRoutine));
            safeStorage.setItem(`exerciseLogs_${newProfile.id}`, JSON.stringify(sortedLogs));
            safeStorage.setItem('activeProfileId', newProfile.id);

            setActiveProfile(newProfile);
        } else {
            handleAddLogs(logsToAdd);
        }
        
        setShowHistory(true);
        setIsReconfiguring(false);
        setNeedsInitialSetup(false);
    }, [activeProfile, isReconfiguring, handleAddLogs]);


    const handleSaveProfile = useCallback((profileData: UserProfile) => {
        setActiveProfile(profileData);
        setAllProfiles(prev => prev.map(p => p.id === profileData.id ? profileData : p));
    }, []);

    const sessionLogs = useMemo(() => {
        if (sessionStartTime) {
            return logs.filter(log => new Date(log.timestamp) >= sessionStartTime);
        }
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return logs.filter(log => new Date(log.timestamp) >= todayStart);
    }, [logs, sessionStartTime]);

    if (!activeProfile && !needsInitialSetup) {
        return (
            <WelcomeScreen 
                profiles={allProfiles}
                savedRoutines={savedRoutines}
                onSelectProfile={handleSelectProfile}
                onStartNewRoutine={handleStartNewRoutine}
                onStartSavedRoutine={handleStartSavedRoutine}
                onCreateProfile={handleCreateProfile}
                onDeleteProfile={handleDeleteProfile}
                onDeleteRoutine={handleDeleteRoutine}
                onViewHistory={handleViewHistory}
            />
        );
    }
    
    if (needsInitialSetup || isReconfiguring) {
        return (
            <SetupWizard 
                onComplete={handleCompleteWizard}
                initialProfile={isReconfiguring ? activeProfile : null}
                initialRoutine={isReconfiguring ? userRoutine : null}
                onCancel={handleLogout}
                startStep={wizardStartStep}
                onSaveManualLog={handleSaveManualLog}
            />
        );
    }
    
    if (activeProfile) {
        return (
            <>
                <div className="bg-slate-900 text-white min-h-screen p-4 sm:p-8">
                  <Header 
                    title={showHistory ? 'Historial de Rutinas' : 'Panel de Rutina'}
                    userName={activeProfile.name}
                    showHistory={showHistory}
                    onNavigateHome={handleReturnToDashboard}
                    onViewHistory={() => setShowHistory(true)}
                    onGoToSettings={handleGoToSettings}
                    onEditRoutine={handleEditTodaysRoutine}
                    onLogout={handleLogout}
                    onGoToRoutineSelection={handleGoToRoutineSelection}
                    onOpenSaveRoutineModal={() => setIsSaveModalOpen(true)}
                  />
                  <main className="mt-8">
                    {showHistory ? (
                      <HistoryScreen 
                        logs={logs}
                        goals={goals}
                        userProfile={activeProfile}
                        userRoutine={userRoutine}
                        onDelete={(idsToDelete) => setLogs(prev => prev.filter(log => !idsToDelete.includes(log.id)))}
                        onAddLogs={handleAddLogs}
                      />
                    ) : (
                      <Dashboard
                        logs={sessionLogs}
                        allLogs={logs}
                        sessionStartTime={sessionStartTime}
                        onStartSession={handleStartWorkoutSession}
                        goals={goals}
                        userProfile={activeProfile}
                        userRoutine={userRoutine}
                        restSettings={restSettings}
                        onLog={handleLogExercise}
                        onUpdateExerciseLog={handleUpdateExerciseLog}
                        onSetGoals={setGoals}
                        onSaveProfile={handleSaveProfile}
                        onSaveRestSettings={setRestSettings}
                        onViewHistory={() => setShowHistory(true)}
                        onGoToSettings={handleGoToSettings}
                        onEditRoutine={handleEditTodaysRoutine}
                        trainingType={trainingType}
                        onSetTrainingType={setTrainingType}
                      />
                    )}
                  </main>
                </div>
                <SaveRoutineModal
                    isOpen={isSaveModalOpen}
                    onClose={() => setIsSaveModalOpen(false)}
                    onSave={(name) => {
                        handleSaveRoutine(name);
                        setIsSaveModalOpen(false);
                    }}
                />
            </>
          );
    }

    return <div className="bg-slate-900 min-h-screen flex items-center justify-center text-red-500">Error: Estado de la aplicación inválido.</div>;
};

export default App;
