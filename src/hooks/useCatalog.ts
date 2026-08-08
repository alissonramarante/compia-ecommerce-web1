import { useQuery } from "@tanstack/react-query";
import {
  categoryService,
  customerService,
  downloadService,
  orderService,
  productService,
  shippingService,
} from "@/services";

export const useProducts = () =>
  useQuery({ queryKey: ["produtos"], queryFn: productService.getProducts });

export const useCategories = () =>
  useQuery({ queryKey: ["categorias"], queryFn: categoryService.getCategories });

export const useOrders = () =>
  useQuery({ queryKey: ["pedidos"], queryFn: orderService.getOrders });

export const useCustomers = () =>
  useQuery({ queryKey: ["clientes"], queryFn: customerService.getCustomers });

export const useDownloads = () =>
  useQuery({ queryKey: ["downloads"], queryFn: downloadService.getDownloads });

export const useShippingTable = () =>
  useQuery({ queryKey: ["fretes"], queryFn: shippingService.getShippingTable });
