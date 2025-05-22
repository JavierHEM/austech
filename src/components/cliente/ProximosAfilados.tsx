'use client';

import { ProximoAfilado } from "@/services/clienteService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ProximosAfiladosProps {
  items: ProximoAfilado[];
  loading?: boolean;
}

export function ProximosAfilados({ items, loading = false }: ProximosAfiladosProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Próximos Afilados</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Días Restantes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(3).fill(0).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                </TableRow>
              ))
            ) : items.length > 0 ? (
              items.map((afilado) => (
                <TableRow key={afilado.id}>
                  <TableCell>{afilado.codigo}</TableCell>
                  <TableCell>{afilado.tipo}</TableCell>
                  <TableCell>
                    <Badge variant={afilado.dias <= 7 ? "destructive" : afilado.dias <= 14 ? "secondary" : "outline"}>
                      {afilado.dias} días
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  No hay próximos afilados programados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
