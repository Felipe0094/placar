import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchWithTeams } from '@/types/match';
import { MatchEditor } from './MatchEditor';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

export const AdminDashboard = () => {
  const [matches, setMatches] = useState<MatchWithTeams[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFinished, setShowFinished] = useState(false);
  const { toast } = useToast();

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, country, logo_url),
          away_team:teams!matches_away_team_id_fkey(id, name, country, logo_url)
        `)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os jogos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleMatchUpdate = (updatedMatch: MatchWithTeams) => {
    setMatches(prev => 
      prev.map(match => 
        match.id === updatedMatch.id ? updatedMatch : match
      )
    );
  };

  const groupMatchesByDate = () => {
    const grouped: { [key: string]: MatchWithTeams[] } = {};
    
    matches.forEach(match => {
      if (!showFinished && match.status === 'finished') {
        return;
      }

      const date = match.match_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(match);
    });

    return grouped;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando jogos...</div>
      </div>
    );
  }

  const groupedMatches = groupMatchesByDate();
  const hasFinishedMatches = matches.some(match => match.status === 'finished');

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Administrador - Copa do Mundo de Clubes 2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <p className="text-center text-muted-foreground">
              Gerencie os placares e status dos jogos
            </p>
            {hasFinishedMatches && (
              <Button
                variant="outline"
                onClick={() => setShowFinished(!showFinished)}
                className="flex items-center gap-2"
              >
                {showFinished ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Ocultar Jogos Finalizados
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Mostrar Jogos Finalizados
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {Object.entries(groupedMatches).map(([date, dateMatches]) => (
          <div key={date} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 capitalize">
              {formatDate(date)}
            </h2>
            <div className="grid gap-4">
              {dateMatches.map((match) => (
                <div
                  key={match.id}
                  data-finished={match.status === 'finished'}
                  className={match.status === 'finished' ? 'transition-opacity duration-300' : ''}
                >
                  <MatchEditor
                    match={match}
                    onUpdate={handleMatchUpdate}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {matches.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhum jogo encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
