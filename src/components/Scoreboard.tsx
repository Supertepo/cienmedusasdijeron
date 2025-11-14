import React,{type JSX} from 'react';

interface ScoreboardProps {
    team1Score: number;
    team2Score: number;
}

export default function Scoreboard({ team1Score, team2Score }: ScoreboardProps): JSX.Element {
    return (
        // Marcador que ocupará el ancho completo en la parte inferior
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-gray-800 border-t-4 border-yellow-400 flex justify-around z-50">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-blue-400">Equipo 1</h2>
                {/* Puntuación dinámica del Equipo 1 */}
                <p className="text-4xl font-extrabold text-white">{team1Score}</p>
            </div>
            <div className="text-center">
                <h2 className="text-2xl font-bold text-red-400">Equipo 2</h2>
                {/* Puntuación dinámica del Equipo 2 */}
                <p className="text-4xl font-extrabold text-white">{team2Score}</p>
            </div>
        </footer>
    );
}