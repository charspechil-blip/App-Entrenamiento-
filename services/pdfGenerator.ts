import type { ExerciseLog, Goals, UserProfile, ExerciseName, Cluster } from '../types';
import { isTimeBased, isBodyweight } from '../utils/exerciseUtils';
import { jsPDF } from 'jspdf';

// Helper functions moved from HistoryLog
const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatDuration = (milliseconds: number): string => {
    if (isNaN(milliseconds) || milliseconds < 0) return '0s';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
  
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (seconds > 0 || result === '') result += `${seconds}s`;
    
    return result.trim();
};


export const generateHistoryPdf = (logs: ExerciseLog[], goals: Goals, userProfile: UserProfile | null, sessionKeys: string[]) => {
    const doc = new jsPDF();
    let y = 15;

    const checkY = () => {
        if (y > 280) {
            doc.addPage();
            y = 15;
        }
    };

    const logsBySession = logs.reduce((acc, log) => {
        const dateKey = formatDate(log.timestamp);
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(log);
        return acc;
    }, {} as Record<string, ExerciseLog[]>);

    doc.setFontSize(22);
    doc.text('Historial de Entrenamiento', 105, y, { align: 'center' });
    y += 10;

    if (userProfile) {
        doc.setFontSize(12);
        doc.text(`Perfil: ${userProfile.name}`, 14, y);
        y += 7;
        doc.setFontSize(10);
        doc.text(`Edad: ${userProfile.age} | Peso: ${userProfile.weight}kg | Altura: ${userProfile.height}cm`, 14, y);
        y += 10;
    }

    sessionKeys.forEach(sessionKey => {
        checkY();
        doc.setDrawColor(200, 200, 200);
        doc.line(14, y, 196, y);
        y += 8;
        checkY();
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(sessionKey, 14, y);
        y += 8;

        const sessionLogs = logsBySession[sessionKey];
        
        const exercisesInSession = sessionLogs.reduce((acc, log) => {
            let exercise = acc.find(e => e.exerciseName === log.exerciseName);
            if (!exercise) {
                exercise = { exerciseName: log.exerciseName, clusters: [], heartRates: [], RPEs: [] };
                acc.push(exercise);
            }
            exercise.clusters.push(...log.clusters);
            if (log.heartRate) exercise.heartRates.push(log.heartRate);
            if (log.perceivedExertion) exercise.RPEs.push(log.perceivedExertion);
            return acc;
        }, [] as { exerciseName: ExerciseName, clusters: Cluster[], heartRates: number[], RPEs: number[] }[]);

        exercisesInSession.forEach(({ exerciseName, clusters, heartRates, RPEs }) => {
            checkY();
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(exerciseName, 14, y);
            y += 6;

            const goal = goals[exerciseName];
            const isClusterWorkout = goal && !!goal.clusterGoals && goal.clusterGoals.length > 0;
            const avgHeartRate = heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : 0;
            const avgRPE = RPEs.length > 0 ? (RPEs.reduce((a, b) => a + b, 0) / RPEs.length).toFixed(1) : 0;


            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            if(isClusterWorkout) {
                // Detailed cluster breakdown of work done
                clusters.forEach((cluster, index) => {
                    checkY();
                    doc.text(`- Clúster ${index + 1}: ${cluster.weight} kg x ${cluster.reps} reps`, 18, y);
                    y += 5;
                });
            } else {
                // Original summary logic
                const totalVolume = clusters.reduce((sum, c) => sum + (c.weight * c.reps), 0);
                const totalReps = clusters.reduce((sum, c) => sum + c.reps, 0);
                const totalTime = clusters.reduce((sum, c) => sum + (c.time || 0), 0);
                const numSets = clusters.length;
                
                let summaryLine = `- ${numSets} serie(s), `;
                if (totalTime > 0) summaryLine += `Tiempo total: ${formatDuration(totalTime * 1000)}.`;
                else if (totalVolume > 0) summaryLine += `${totalReps} reps totales. Volumen: ${totalVolume}kg.`;
                else summaryLine += `${totalReps} reps totales.`;
                doc.text(summaryLine, 18, y);
                y += 5;
            }

            let optionalDataLine = [];
            if (avgHeartRate > 0) {
                optionalDataLine.push(`FC Media: ${avgHeartRate} PPM`);
            }
            if (Number(avgRPE) > 0) {
                optionalDataLine.push(`RPE Medio: ${avgRPE}/10`);
            }

            if (optionalDataLine.length > 0) {
                checkY();
                doc.text(optionalDataLine.join(' | '), 18, y);
                y += 8;
            }

            if (goal) {
                doc.setFont('helvetica', 'bold');
                doc.text('Meta vs. Logrado:', 22, y);
                y += 5;
                doc.setFont('helvetica', 'normal');

                let goalStr = '', achievedStr = '', percentage = 0;
                const isClusterGoal = !!goal.clusterGoals && goal.clusterGoals.length > 0;
                
                // Recalculate achieved values here for clarity
                const totalVolume = clusters.reduce((sum, c) => sum + (c.weight * c.reps), 0);
                const totalReps = clusters.reduce((sum, c) => sum + c.reps, 0);
                const totalTime = clusters.reduce((sum, c) => sum + (c.time || 0), 0);
                const numSets = clusters.length;


                if (isTimeBased(exerciseName)) {
                    goalStr = `Tiempo: ${goal.totalTime}s`;
                    achievedStr = `Logrado: ${totalTime}s`;
                    percentage = goal.totalTime && goal.totalTime > 0 ? (totalTime / goal.totalTime) * 100 : 0;
                } else {
                    const isBody = isBodyweight(exerciseName) && !isTimeBased(exerciseName) && !goal.isWeighted && !isClusterGoal;
                    let goalVol = 0;
                    let goalReps = 0;
                    let goalSeriesCount = 0;

                    if (isClusterGoal) {
                        goalSeriesCount = goal.clusterGoals!.length;
                        goalVol = goal.clusterGoals!.reduce((s, c) => s + (c.weight * (c.reps || 0)), 0);
                        goalReps = goal.clusterGoals!.reduce((s, c) => s + (c.reps || 0), 0);
                    } else {
                        goalSeriesCount = goal.series || 0;
                        goalVol = (goal.weight || 0) * (goal.reps || 0) * goalSeriesCount;
                        goalReps = (goal.reps || 0) * goalSeriesCount;
                    }
                    
                    if (isBody) {
                         goalStr = `Series: ${goalSeriesCount}, Reps: ${goalReps}`;
                         achievedStr = `Logrado: ${numSets} series, ${totalReps} reps`;
                         percentage = goalReps > 0 ? (totalReps / goalReps) * 100 : 0;
                    } else {
                         goalStr = `Series: ${goalSeriesCount}, Volumen: ${goalVol}kg`;
                         achievedStr = `Logrado: ${numSets} series, ${totalVolume}kg`;
                         percentage = goalVol > 0 ? (totalVolume / goalVol) * 100 : 0;
                    }
                }
                doc.text(`- Objetivo: ${goalStr}`, 26, y);
                y += 5;
                doc.text(`- Realizado: ${achievedStr} (${Math.min(100, percentage).toFixed(0)}%)`, 26, y);
                y += 7;
            }
        });

        // Session Summary
        if (sessionLogs.length > 0) {
            const startTime = new Date(sessionLogs[0].timestamp);
            const endTime = new Date(sessionLogs[sessionLogs.length - 1].timestamp);
            const duration = endTime.getTime() - startTime.getTime();
            const totalSessionVolume = exercisesInSession.reduce((sum, ex) => sum + ex.clusters.reduce((s, c) => s + (c.weight * c.reps), 0), 0);
            const totalSessionReps = exercisesInSession.reduce((sum, ex) => sum + ex.clusters.reduce((s, c) => s + c.reps, 0), 0);

            y += 5;
            checkY();
            doc.setDrawColor(220, 220, 220);
            doc.line(22, y, 188, y);
            y += 8;

            doc.setFont('helvetica', 'bold');
            doc.text('Resumen de la Sesión', 105, y, { align: 'center' });
            y += 7;
            doc.setFont('helvetica', 'normal');
            doc.text(`Duración Total:  ${formatDuration(duration)}`, 105, y, { align: 'center' });
            y += 5;
            doc.text(`Volumen Total:  ${totalSessionVolume} kg`, 105, y, { align: 'center' });
            y += 5;
            doc.text(`Repeticiones Totales:  ${totalSessionReps}`, 105, y, { align: 'center' });
            y += 5;
            doc.text(`Horarios:  ${formatTime(sessionLogs[0].timestamp)} - ${formatTime(sessionLogs[sessionLogs.length - 1].timestamp)}`, 105, y, { align: 'center' });
            y += 10;
        }
    });

    const getSanitizedDateString = (dateKey: string): string => {
        const logForDate = logs.find(log => formatDate(log.timestamp) === dateKey);
        if (logForDate) {
            return new Date(logForDate.timestamp).toISOString().split('T')[0];
        }
        return new Date().toISOString().split('T')[0];
    };

    let fileName = '';
    const namePart = userProfile?.name.replace(/ /g, '_') || 'usuario';

    if (sessionKeys.length === 1) {
        const dateStr = getSanitizedDateString(sessionKeys[0]);
        fileName = `sesion_${namePart}_${dateStr}.pdf`;
    } else {
        const dateStr = new Date().toISOString().split('T')[0];
        fileName = `historial_entrenamiento_${namePart}_${dateStr}.pdf`;
    }

    doc.save(fileName);
};