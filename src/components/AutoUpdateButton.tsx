import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getMatchResults } from '@/services/gemini';
import { MatchWithTeams } from '@/types/match';
import { RefreshCw } from 'lucide-react';

interface AutoUpdateButtonProps {
  match: MatchWithTeams;
  onUpdate: (updatedMatch: MatchWithTeams) => void;
}

export const AutoUpdateButton: React.FC<AutoUpdateButtonProps> = ({ match, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleAutoUpdate = async () => {
    setIsUpdating(true);
    try {
      // Cria uma descrição do jogo para o Gemini
      const matchDescription = `${match.home_team.name} vs ${match.away_team.name} - ${match.match_date} ${match.match_time}`;
      console.log('🔍 Consultando Gemini com descrição:', matchDescription);
      
      // Consulta o Gemini para obter os resultados
      const result = await getMatchResults(matchDescription);
      console.log('📊 Resultado do Gemini:', result);
      
      if (!result) {
        throw new Error('Não foi possível obter os resultados do jogo');
      }

      // Validação dos dados retornados
      if (typeof result.home_score !== 'number' && result.home_score !== null) {
        throw new Error('Formato inválido para home_score');
      }
      if (typeof result.away_score !== 'number' && result.away_score !== null) {
        throw new Error('Formato inválido para away_score');
      }
      if (!['upcoming', 'live', 'finished'].includes(result.status)) {
        throw new Error('Status inválido');
      }

      console.log('📝 Dados validados, atualizando no Supabase...');

      // Atualiza o jogo no Supabase
      const { data, error } = await supabase
        .from('matches')
        .update({
          home_score: result.home_score,
          away_score: result.away_score,
          status: result.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', match.id)
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, country, logo_url),
          away_team:teams!matches_away_team_id_fkey(id, name, country, logo_url)
        `)
        .single();

      if (error) {
        console.error('❌ Erro no Supabase:', error);
        throw error;
      }

      console.log('✅ Dados atualizados com sucesso:', data);

      onUpdate(data);
      toast({
        title: "Sucesso",
        description: "Jogo atualizado automaticamente!"
      });
    } catch (error) {
      console.error('💥 Erro ao atualizar automaticamente:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o jogo automaticamente",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAutoUpdate}
      disabled={isUpdating}
    >
      <RefreshCw className={`h-4 w-4 mr-1 ${isUpdating ? 'animate-spin' : ''}`} />
      {isUpdating ? 'Atualizando...' : 'Atualizar Automaticamente'}
    </Button>
  );
}; 