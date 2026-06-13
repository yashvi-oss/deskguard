import React, { useState, useEffect } from 'react';
import { Desk, DeskStatus } from '../types';
import '../styles/map.css';

interface LibraryMapProps {
  desks: Desk[];
  onDeskClick: (deskId: string) => void;
  currentDeskId?: string | null;
}

const statusToColor: Record<DeskStatus, string> = {
  free: '#4CAF50', // Green
  occupied: '#F44336', // Red
  away: '#FFC107', // Yellow/Amber
  abandoned: '#757575', // Gray
};

const getStatusLabel = (status: DeskStatus): string => {
  const labels: Record<DeskStatus, string> = {
    free: 'Free',
    occupied: 'Occupied',
    away: 'Away',
    abandoned: 'Abandoned',
  };
  return labels[status];
};

export const LibraryMap: React.FC<LibraryMapProps> = ({ desks, onDeskClick, currentDeskId }) => {
  const [hoveredDesk, setHoveredDesk] = useState<string | null>(null);

  // Calculate grid layout (10 columns)
  const GRID_COLS = 10;
  const DESK_SIZE = 50;
  const PADDING = 5;
  const cellSize = DESK_SIZE + PADDING * 2;

  const cols = Math.min(GRID_COLS, desks.length);
  const rows = Math.ceil(desks.length / cols);
  const width = cols * cellSize + 40;
  const height = rows * cellSize + 40;

  return (
    <div className="library-map">
      <h2>📚 Library Desk Map</h2>
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: statusToColor.free }}></div>
          <span>Free</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: statusToColor.occupied }}></div>
          <span>Occupied</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: statusToColor.away }}></div>
          <span>Away</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: statusToColor.abandoned }}></div>
          <span>Abandoned</span>
        </div>
      </div>

      <svg width={width} height={height} className="map-svg">
        {desks.map((desk, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = 20 + col * cellSize;
          const y = 20 + row * cellSize;

          return (
            <g key={desk.id}>
              {/* Desk rectangle */}
              <rect
                x={x}
                y={y}
                width={DESK_SIZE}
                height={DESK_SIZE}
                fill={statusToColor[desk.status]}
                stroke={currentDeskId === desk.id ? '#000' : '#ccc'}
                strokeWidth={currentDeskId === desk.id ? 3 : 1}
                rx={4}
                style={{
                  cursor: desk.status === 'free' ? 'pointer' : 'default',
                  opacity: hoveredDesk === desk.id || currentDeskId === desk.id ? 1 : 0.85,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={() => setHoveredDesk(desk.id)}
                onMouseLeave={() => setHoveredDesk(null)}
                onClick={() => desk.status === 'free' && onDeskClick(desk.id)}
              />

              {/* Desk number */}
              <text
                x={x + DESK_SIZE / 2}
                y={y + DESK_SIZE / 2 + 5}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="white"
                pointerEvents="none"
              >
                {desk.number}
              </text>

              {/* Tooltip on hover */}
              {hoveredDesk === desk.id && (
                <g>
                  <rect
                    x={x}
                    y={y - 30}
                    width={100}
                    height={25}
                    fill="#333"
                    rx={4}
                  />
                  <text
                    x={x + 50}
                    y={y - 12}
                    textAnchor="middle"
                    fontSize="12"
                    fill="white"
                    pointerEvents="none"
                  >
                    Desk {desk.number} - {getStatusLabel(desk.status)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
