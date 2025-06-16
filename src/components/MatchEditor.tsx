import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { MatchWithTeams, MatchStatus } from '@/types/match';
import { useToast } from '@/hooks/use-toast';
import { Edit, Check, X } from 'lucide-react';

interface MatchEditorProps {
  match: MatchWithTeams;
  onUpdate: (updatedMatch: MatchWithTeams) => void;
}

export const MatchEditor: React.FC<MatchEditorProps> = ({ match, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [homeScore, setHomeScore] = useState(match.home_score?.toString() || '');
  const [awayScore, setAwayScore] = useState(match.away_score?.toString() || '');
  const [status, setStatus] = useState(match.status);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove segundos
  };

  const handleSave = async () => {
    setSaving(true);
    console.log('🎯 INÍCIO DO SALVAMENTO');
    console.log('Match ID:', match.id);
    console.log('Home Score Input:', homeScore);
    console.log('Away Score Input:', awayScore);
    console.log('Status Input:', status);
    
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Se o campo estiver vazio, salva como null
      updateData.home_score = homeScore === '' ? null : parseInt(homeScore);
      updateData.away_score = awayScore === '' ? null : parseInt(awayScore);

      console.log('📦 Dados para atualização:', updateData);
      console.log('🔄 Iniciando UPDATE no Supabase...');

      // Primeiro, fazer o update
      const { data: updatedMatch, error: updateError } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', match.id)
        .select();

      console.log('✅ Resultado do UPDATE:', { updatedMatch, updateError });

      if (updateError) {
        console.error('❌ Erro no UPDATE:', updateError);
        throw updateError;
      }

      console.log('🔍 Buscando dados atualizados...');

      // Adicionar um pequeno delay para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));

      // Buscar os dados atualizados com um timestamp para evitar cache
      const { data, error: fetchError } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, country, logo_url),
          away_team:teams!matches_away_team_id_fkey(id, name, country, logo_url)
        `)
        .eq('id', match.id)
        .single();

      console.log('📊 Dados fetched:', { data, fetchError });
      
      if (data) {
        console.log('🔍 Comparação de placares:');
        console.log('  - Home Score enviado:', updateData.home_score);
        console.log('  - Home Score retornado:', data.home_score);
        console.log('  - Away Score enviado:', updateData.away_score);
        console.log('  - Away Score retornado:', data.away_score);
        console.log('  - Status enviado:', updateData.status);
        console.log('  - Status retornado:', data.status);
      }

      if (fetchError) {
        console.error('❌ Erro no FETCH:', fetchError);
        throw fetchError;
      }

      console.log('🎉 Dados atualizados com sucesso no Supabase!');
      console.log('📝 Dados antes da atualização:', match);
      console.log('📝 Dados depois da atualização:', data);

      onUpdate(data);
      setIsEditing(false);
      toast({
        title: "Sucesso",
        description: "Jogo atualizado com sucesso!"
      });
    } catch (error) {
      console.error('💥 ERRO GERAL ao atualizar jogo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o jogo",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
      console.log('🏁 FIM DO PROCESSO DE SALVAMENTO');
    }
  };

  const handleCancel = () => {
    setHomeScore(match.home_score?.toString() || '');
    setAwayScore(match.away_score?.toString() || '');
    setStatus(match.status);
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'text-blue-600';
      case 'live': return 'text-green-600';
      case 'finished': return 'text-red-600 font-bold';
      default: return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Agendado';
      case 'live': return 'Ao Vivo';
      case 'finished': return 'Finalizado';
      default: return status;
    }
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200" data-status={match.status}>
      <CardHeader className={`pb-3 transition-colors duration-200 ${
        match.status === 'live' ? 'bg-green-50' : 'bg-gradient-to-r from-gray-50 to-white'
      }`}>
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground font-medium">
            {formatDate(match.match_date)} às {formatTime(match.match_time)}
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="hover:bg-gray-100"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={saving}
                  className="hover:bg-gray-100"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="text-right flex-1">
              <div className="font-semibold text-lg">{match.home_team.name}</div>
              <div className="text-sm text-muted-foreground">{match.home_team.country}</div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Input
                    type="number"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    placeholder="0"
                    className="w-16 text-center text-lg font-bold"
                    min="0"
                  />
                  <span className="text-xl font-bold text-gray-400">×</span>
                  <Input
                    type="number"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    placeholder="0"
                    className="w-16 text-center text-lg font-bold"
                    min="0"
                  />
                </>
              ) : (
                <div className="text-2xl font-bold bg-gray-50 px-6 py-2 rounded-lg">
                  {match.home_score ?? '-'} × {match.away_score ?? '-'}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="font-semibold text-lg">{match.away_team.name}</div>
              <div className="text-sm text-muted-foreground">{match.away_team.country}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="status" className="font-medium">Status:</Label>
            {isEditing ? (
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Agendado</SelectItem>
                  <SelectItem value="live">Ao Vivo</SelectItem>
                  <SelectItem value="finished">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className={`font-medium ${getStatusColor(match.status)} px-3 py-1 rounded-full bg-gray-50`}>
                {getStatusLabel(match.status)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
