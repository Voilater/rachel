export interface ClientUserDto {
  id: string;
  name: string;
  email: string;
}

export interface AccountProfileDto {
  name: string;
  email: string;
  phone: string;
  shippingStreet: string;
  shippingCity: string;
  shippingZip: string;
  image: string | null;
}
