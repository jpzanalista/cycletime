'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type CycleTimeData = {
  list_name: string;
  avg_cycle_time: number;
  formatted?: {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  };
};

const API_URL = 'http://localhost:3001/api/cycletime/avg';

export default function DashboardPage() {
  const [data, setData] = useState<CycleTimeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeUnit, setTimeUnit] = useState<'seconds' | 'minutes' | 'hours'>('seconds');
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all');

  const handleTimeUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeUnit(e.target.value as 'seconds' | 'minutes' | 'hours');
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriod(e.target.value as 'all' | 'week' | 'month');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}?period=${period}`);
        
        if (!res.ok) {
          throw new Error('Falha ao buscar dados da API');
        }
        
        const data: CycleTimeData[] = await res.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const chartData = useMemo(() => ({
    labels: data.map(item => item.list_name),
    datasets: [
      {
        label: `Tempo Médio (${timeUnit})`,
        data: data.map(item => {
          switch (timeUnit) {
            case 'minutes': return item.avg_cycle_time / 60;
            case 'hours': return item.avg_cycle_time / 3600;
            default: return item.avg_cycle_time;
          }
        }),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  }), [data, timeUnit]);

  const options = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Tempo de Ciclo por Coluna',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: `Tempo (${timeUnit})`,
        },
      },
    },
  }), [timeUnit]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh'
      }}>
        <p>Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <h1>Erro no Dashboard</h1>
        <p>{error}</p>
        <p>Por favor, tente recarregar a página.</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Nenhum dado encontrado</h1>
        <p>Não há dados disponíveis para o período selecionado.</p>
      </div>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Dashboard de Tempo de Ciclo</h1>
      
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <div>
          <label htmlFor="timeUnit">Unidade de Tempo: </label>
          <select
            id="timeUnit"
            value={timeUnit}
            onChange={handleTimeUnitChange}
            style={{ padding: '0.5rem' }}
            aria-label="Selecionar unidade de tempo"
          >
            <option value="seconds">Segundos</option>
            <option value="minutes">Minutos</option>
            <option value="hours">Horas</option>
          </select>
        </div>

        <div>
          <label htmlFor="period">Período: </label>
          <select
            id="period"
            value={period}
            onChange={handlePeriodChange}
            style={{ padding: '0.5rem' }}
            aria-label="Selecionar período"
          >
            <option value="all">Todo o Período</option>
            <option value="month">Último Mês</option>
            <option value="week">Última Semana</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', height: '500px' }}>
        <Bar data={chartData} options={options} />
      </div>

      <div>
        <h2>Dados Detalhados</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {data.map((item) => (
            <div 
              key={item.list_name} 
              style={{ 
                border: '1px solid #ddd', 
                padding: '1rem', 
                borderRadius: '4px'
              }}
            >
              <h3 style={{ marginTop: 0 }}>{item.list_name}</h3>
              <p>Segundos: {item.avg_cycle_time.toFixed(2)}s</p>
              {item.formatted && (
                <>
                  <p>Horas: {item.formatted.hours}h</p>
                  <p>Minutos: {item.formatted.minutes}min</p>
                  <p>Dias: {item.formatted.days}d</p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}