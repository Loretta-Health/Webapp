import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Home, ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type CommunityType = 'loretta' | 'family';

interface CommunitySelectorProps {
  value: CommunityType;
  onChange: (value: CommunityType) => void;
  className?: string;
}

export default function CommunitySelector({ value, onChange, className = '' }: CommunitySelectorProps) {
  const communities = [
    {
      id: 'loretta' as CommunityType,
      name: 'Loretta Community',
      description: 'Compare with all Loretta members',
      icon: Users,
      memberCount: '2,847 members'
    },
    {
      id: 'family' as CommunityType,
      name: 'My Family',
      description: 'Just you and your family members',
      icon: Home,
      memberCount: '5 members'
    }
  ];

  const selectedCommunity = communities.find(c => c.id === value) || communities[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`w-full justify-between text-sm bg-gradient-to-r from-primary/10 via-chart-2/10 to-secondary/10 border-primary/30 hover:border-primary/50 ${className}`}
          data-testid="button-community-selector"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
              <selectedCommunity.icon className="w-3 h-3 text-white" />
            </div>
            <span className="truncate font-bold">{selectedCommunity.name}</span>
          </div>
          <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0 text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {communities.map((community) => (
          <DropdownMenuItem
            key={community.id}
            onClick={() => onChange(community.id)}
            className="flex items-start gap-3 p-3 cursor-pointer"
            data-testid={`option-community-${community.id}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              value === community.id 
                ? 'bg-gradient-to-br from-primary to-chart-2 text-white' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <community.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{community.name}</span>
                {value === community.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{community.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{community.memberCount}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
