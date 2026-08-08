import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format";
import type { CatalogFilters } from "@/lib/catalog";

interface Props {
  filters: CatalogFilters;
  onChange: (filters: CatalogFilters) => void;
  categorias: string[];
  tags: string[];
  precoLimite: number;
}

const formatos = [
  { value: "fisico", label: "Físico" },
  { value: "digital", label: "Digital" },
];

const disponibilidades = [
  { value: "disponivel", label: "Disponível" },
  { value: "baixo", label: "Estoque baixo" },
  { value: "esgotado", label: "Indisponível" },
];

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Group({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <h3 className="font-display text-sm font-semibold">{title}</h3>
      <div className="mt-3 space-y-2">
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <Checkbox
              id={`${title}-${opt.value}`}
              checked={selected.includes(opt.value)}
              onCheckedChange={() => onToggle(opt.value)}
            />
            <Label
              htmlFor={`${title}-${opt.value}`}
              className="cursor-pointer text-sm font-normal text-muted-foreground"
            >
              {opt.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductFilter({ filters, onChange, categorias, tags, precoLimite }: Props) {
  const precoMax = filters.precoMax || precoLimite;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold">Filtros</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({
              ...filters,
              categorias: [],
              formatos: [],
              tags: [],
              disponibilidade: [],
              precoMax: 0,
            })
          }
        >
          Limpar
        </Button>
      </div>
      <Separator />

      <Group
        title="Categoria"
        options={categorias.map((c) => ({ value: c, label: c }))}
        selected={filters.categorias}
        onToggle={(v) => onChange({ ...filters, categorias: toggle(filters.categorias, v) })}
      />
      <Separator />

      <Group
        title="Formato"
        options={formatos}
        selected={filters.formatos}
        onToggle={(v) => onChange({ ...filters, formatos: toggle(filters.formatos, v) })}
      />
      <Separator />

      <div>
        <h3 className="font-display text-sm font-semibold">Faixa de preço</h3>
        <p className="mt-2 text-sm text-muted-foreground">Até {formatCurrency(precoMax)}</p>
        <Slider
          className="mt-4"
          min={20}
          max={precoLimite}
          step={10}
          value={[precoMax]}
          onValueChange={(value) => onChange({ ...filters, precoMax: value[0] ?? precoLimite })}
        />
      </div>
      <Separator />

      <Group
        title="Disponibilidade"
        options={disponibilidades}
        selected={filters.disponibilidade}
        onToggle={(v) =>
          onChange({ ...filters, disponibilidade: toggle(filters.disponibilidade, v) })
        }
      />
      <Separator />

      <div>
        <h3 className="font-display text-sm font-semibold">Tags</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = filters.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...filters, tags: toggle(filters.tags, tag) })}
                className={
                  active
                    ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                    : "rounded-full border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                }
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
