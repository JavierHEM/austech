'use client';

import { UltimoAfilado } from "@/services/clienteService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface UltimosAfiladosProps {
  items: UltimoAfilado[];
  loading?: boolean;
}

export function UltimosAfilados({ items, loading = false }: UltimosAfiladosProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Últimos Afilados</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array(3).fill(0).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                </TableRow>
              ))
            ) : items.length > 0 ? (
              items.map((afilado) => (
                <TableRow key={afilado.id}>
                  <TableCell>{afilado.codigo || 'N/A'}</TableCell>
                  <TableCell>{afilado.tipo || 'N/A'}</TableCell>
                  <TableCell>{afilado.fecha || 'N/A'}</TableCell>
                  <TableCell>{afilado.estado || 'N/A'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No hay afilados recientes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
