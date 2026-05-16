declare module '@paypal/checkout-server-sdk' {
  export namespace core {
    class LiveEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
    class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string);
    }
    class PayPalHttpClient {
      constructor(environment: any);
      execute(request: any): Promise<any>;
    }
  }
  
  export namespace orders {
    class OrdersCreateRequest {
      requestBody(body: any): void;
    }
    class OrdersCaptureRequest {
      constructor(orderId: string);
    }
  }
  
  export namespace payments {
    class AuthorizationsCaptureRequest {
      constructor(authorizationId: string);
    }
  }
}
