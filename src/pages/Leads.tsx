
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, User, Phone, Mail, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data for the lead pipeline
const initialLeadsData = [
  {
    id: "1",
    stage: 1,
    name: "João Silva",
    company: "JS Marketing",
    email: "joao@jsmarketing.com",
    phone: "(11) 98765-4321",
    interest: "Tráfego Pago",
    createDate: "2023-05-10",
    lastContact: "2023-05-15",
  },
  {
    id: "2",
    stage: 2,
    name: "Maria Oliveira",
    company: "Oliveira Digital",
    email: "maria@oliveiradigital.com",
    phone: "(21) 98765-4321",
    interest: "Social Media",
    createDate: "2023-05-12",
    lastContact: "2023-05-14",
  },
  {
    id: "3",
    stage: 3,
    name: "Pedro Santos",
    company: "Santos Tech",
    email: "pedro@santostech.com",
    phone: "(31) 98765-4321",
    interest: "Growth 2",
    createDate: "2023-05-08",
    lastContact: "2023-05-13",
  },
  {
    id: "4",
    stage: 4,
    name: "Ana Souza",
    company: "Souza Design",
    email: "ana@souzadesign.com",
    phone: "(41) 98765-4321",
    interest: "Landing Page",
    createDate: "2023-05-05",
    lastContact: "2023-05-11",
  },
  {
    id: "5",
    stage: 5,
    name: "Carlos Ferreira",
    company: "Ferreira Marketing",
    email: "carlos@ferreiramarketing.com",
    phone: "(51) 98765-4321",
    interest: "Growth 1",
    createDate: "2023-05-01",
    lastContact: "2023-05-10",
  },
  {
    id: "6",
    stage: 6,
    name: "Lúcia Pereira",
    company: "Pereira Consultoria",
    email: "lucia@pereiraconsultoria.com",
    phone: "(61) 98765-4321",
    interest: "Site",
    createDate: "2023-04-28",
    lastContact: "2023-05-08",
  },
  {
    id: "7",
    stage: 7,
    name: "Roberto Alves",
    company: "Alves Agência",
    email: "roberto@alvesagencia.com",
    phone: "(71) 98765-4321",
    interest: "Growth 3",
    createDate: "2023-04-25",
    lastContact: "2023-05-05",
  },
  {
    id: "8",
    stage: 8,
    name: "Fernanda Lima",
    company: "Lima Digital",
    email: "fernanda@limadigital.com",
    phone: "(81) 98765-4321",
    interest: "Tráfego Pago",
    createDate: "2023-04-20",
    lastContact: "2023-05-02",
  },
];

// Pipeline stages
const stages = [
  {
    id: 1,
    name: "Lead Captado",
    color: "bg-yellow-500",
    emoji: "🟡",
  },
  {
    id: 2,
    name: "Contato Inicial (SDR)",
    color: "bg-orange-500",
    emoji: "🟠",
  },
  {
    id: 3,
    name: "Lead Qualificado (Pré-call)",
    color: "bg-yellow-500",
    emoji: "🟡",
  },
  {
    id: 4,
    name: "Call Realizada",
    color: "bg-blue-500",
    emoji: "🔵",
  },
  {
    id: 5,
    name: "Proposta Enviada",
    color: "bg-purple-500",
    emoji: "🟣",
  },
  {
    id: 6,
    name: "Negociação",
    color: "bg-amber-800",
    emoji: "🟤",
  },
  {
    id: 7,
    name: "Contrato + Pagamento",
    color: "bg-green-500",
    emoji: "🟢",
  },
  {
    id: 8,
    name: "Onboarding Agendado",
    color: "bg-primary",
    emoji: "🚀",
  },
  {
    id: 9,
    name: "Transferido para Operação",
    color: "bg-green-700",
    emoji: "✅",
  },
];

// Interface for a lead
interface Lead {
  id: string;
  stage: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  interest: string;
  createDate: string;
  lastContact: string;
  message?: string;
}

// Interface for a pipeline stage
interface Stage {
  id: number;
  name: string;
  color: string;
  emoji: string;
}

const Leads = () => {
  const [leadsData, setLeadsData] = useState<Lead[]>(initialLeadsData);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const { toast } = useToast();
  
  // Form state for new lead
  const [newLead, setNewLead] = useState<Omit<Lead, "id" | "stage" | "createDate" | "lastContact">>({
    name: "",
    company: "",
    email: "",
    phone: "",
    interest: "",
    message: "",
  });

  // Filter leads based on search query
  const filteredLeads = leadsData.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewLead((prev) => ({ ...prev, [id]: value }));
  };
  
  // Handle select change
  const handleSelectChange = (value: string) => {
    setNewLead((prev) => ({ ...prev, interest: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!newLead.name || !newLead.email || !newLead.phone || !newLead.interest) {
      toast({
        title: "Erro no formulário",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    // Create new lead
    const today = new Date().toISOString().split("T")[0];
    const id = (leadsData.length + 1).toString();
    
    const createdLead: Lead = {
      id,
      stage: 1, // Start at first stage
      createDate: today,
      lastContact: today,
      ...newLead,
    };
    
    // Add to leads data
    setLeadsData([...leadsData, createdLead]);
    
    // Reset form and close dialog
    setNewLead({
      name: "",
      company: "",
      email: "",
      phone: "",
      interest: "",
      message: "",
    });
    setIsAddLeadOpen(false);
    
    toast({
      title: "Lead adicionado",
      description: `${newLead.name} foi adicionado à pipeline como Lead Captado.`,
    });
  };

  // Drag and drop functions
  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageId: number) => {
    if (draggedLead && draggedLead.stage !== stageId) {
      // Update the lead's stage
      const updatedLeads = leadsData.map((lead) =>
        lead.id === draggedLead.id
          ? { ...lead, stage: stageId, lastContact: new Date().toISOString().split("T")[0] }
          : lead
      );
      
      setLeadsData(updatedLeads);
      
      toast({
        title: "Lead movido",
        description: `${draggedLead.name} foi movido para ${stages.find((s) => s.id === stageId)?.name}.`,
      });
      
      setDraggedLead(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Pipeline de Leads</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar lead..."
              className="pl-8 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Lead</DialogTitle>
                <DialogDescription>
                  Preencha as informações do lead para adicioná-lo à pipeline.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <ScrollArea className="max-h-[60vh]">
                  <div className="grid gap-4 py-4 px-1">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          className="pl-8"
                          placeholder="Nome do lead"
                          value={newLead.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa</Label>
                      <Input
                        id="company"
                        placeholder="Nome da empresa (opcional)"
                        value={newLead.company}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          className="pl-8"
                          placeholder="email@exemplo.com"
                          value={newLead.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          className="pl-8"
                          placeholder="(00) 00000-0000"
                          value={newLead.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="interest">Interesse</Label>
                      <Select onValueChange={handleSelectChange} value={newLead.interest}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o serviço de interesse" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tráfego Pago">Tráfego Pago</SelectItem>
                          <SelectItem value="Social Media">Social Media</SelectItem>
                          <SelectItem value="Growth 1">Growth 1</SelectItem>
                          <SelectItem value="Growth 2">Growth 2</SelectItem>
                          <SelectItem value="Growth 3">Growth 3</SelectItem>
                          <SelectItem value="Landing Page">Landing Page</SelectItem>
                          <SelectItem value="Site">Site</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem</Label>
                      <Textarea
                        id="message"
                        placeholder="Informações adicionais do lead"
                        value={newLead.message || ""}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </ScrollArea>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsAddLeadOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Adicionar Lead</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 overflow-x-auto pb-8">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="min-w-[300px] h-full"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
          >
            <Card className="h-full">
              <CardHeader className={`${stage.color} text-white rounded-t-lg flex flex-row justify-between items-center p-4`}>
                <CardTitle className="text-base font-medium flex items-center">
                  <span className="mr-2">{stage.emoji}</span>
                  {stage.name}
                </CardTitle>
                <Badge variant="secondary" className="bg-white text-black">
                  {filteredLeads.filter((lead) => lead.stage === stage.id).length}
                </Badge>
              </CardHeader>
              <CardContent className="p-2 overflow-y-auto max-h-[500px]">
                {filteredLeads
                  .filter((lead) => lead.stage === stage.id)
                  .map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-card m-2 p-3 rounded-md border shadow-sm cursor-grab hover:border-primary transition-colors"
                      draggable
                      onDragStart={() => handleDragStart(lead)}
                    >
                      <div className="font-medium">{lead.name}</div>
                      {lead.company && (
                        <div className="text-sm text-muted-foreground">{lead.company}</div>
                      )}
                      <div className="mt-2 flex items-center text-xs text-muted-foreground">
                        <Badge variant="outline" className="mr-1">
                          {lead.interest}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        Contato: {new Date(lead.lastContact).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))}
                {filteredLeads.filter((lead) => lead.stage === stage.id).length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Sem leads nesta etapa
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leads;
