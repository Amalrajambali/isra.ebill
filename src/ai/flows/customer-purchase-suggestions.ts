'use server';
/**
 * @fileOverview A Genkit flow that provides personalized product recommendations based on a customer's purchase history and current inventory.
 *
 * - customerPurchaseSuggestions - A function that handles the generation of purchase suggestions.
 * - CustomerPurchaseSuggestionsInput - The input type for the customerPurchaseSuggestions function.
 * - CustomerPurchaseSuggestionsOutput - The return type for the customerPurchaseSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomerPurchaseHistoryItemSchema = z.object({
  productId: z.string().describe('The ID of the product purchased.'),
  productName: z.string().describe('The name of the product purchased.'),
  category: z
    .enum(['Churidar', 'Saree', 'Kurti', 'Dupatta', 'Shawl', 'Other'])
    .describe('The category of the purchased product.'),
  quantity: z.number().int().positive().describe('The quantity purchased.'),
  price: z.number().positive().describe('The price at which the product was purchased.'),
});

const CurrentInventoryItemSchema = z.object({
  productId: z.string().describe('The ID of the product in inventory.'),
  productName: z.string().describe('The name of the product in inventory.'),
  category: z
    .enum(['Churidar', 'Saree', 'Kurti', 'Dupatta', 'Shawl', 'Other'])
    .describe('The category of the product in inventory.'),
  sellingPrice: z.number().positive().describe('The selling price of the product.'),
  stockQuantity: z.number().int().min(0).describe('The current stock quantity of the product.'),
});

const CustomerPurchaseSuggestionsInputSchema = z.object({
  customerId: z.string().describe('The unique identifier for the customer.'),
  purchaseHistory: z
    .array(CustomerPurchaseHistoryItemSchema)
    .describe('A list of the customer\u0027s past purchases.'),
  currentInventory: z
    .array(CurrentInventoryItemSchema)
    .describe('A list of all products currently available in inventory.'),
});
export type CustomerPurchaseSuggestionsInput = z.infer<typeof CustomerPurchaseSuggestionsInputSchema>;

const SuggestedProductSchema = z.object({
  productId: z.string().describe('The ID of the recommended product.'),
  productName: z.string().describe('The name of the recommended product.'),
  category: z.string().describe('The category of the recommended product.'),
  reason: z.string().describe('A brief explanation for the recommendation.'),
});

const CustomerPurchaseSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(SuggestedProductSchema)
    .describe('A list of personalized product recommendations.'),
});
export type CustomerPurchaseSuggestionsOutput = z.infer<
  typeof CustomerPurchaseSuggestionsOutputSchema
>;

export async function customerPurchaseSuggestions(
  input: CustomerPurchaseSuggestionsInput
): Promise<CustomerPurchaseSuggestionsOutput> {
  return customerPurchaseSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customerPurchaseSuggestionsPrompt',
  input: {schema: CustomerPurchaseSuggestionsInputSchema},
  output: {schema: CustomerPurchaseSuggestionsOutputSchema},
  prompt: `You are an expert sales associate for ISRA Ethnics, a Churidars & Sarees shop. Your goal is to provide personalized product recommendations to customers based on their past purchase history and the current available inventory.

Here is the customer's past purchase history:
{{#if purchaseHistory}}
{{#each purchaseHistory}}
- Product: {{this.productName}}, Category: {{this.category}}, Quantity: {{this.quantity}}, Price: {{this.price}}
{{/each}}
{{else}}
No past purchase history available for this customer. Consider suggesting popular items or complementary products based on general fashion sense.
{{/if}}

Here is the current inventory available in the shop:
{{#each currentInventory}}
- Product: {{this.productName}}, Category: {{this.category}}, Price: \u20B9{{this.sellingPrice}}, Stock: {{this.stockQuantity}}
{{/each}}

Based on the customer's purchase history and the available inventory, suggest 3-5 products that the customer might like. For each suggestion, provide the product's name, category, and a brief reason explaining why it is a good recommendation. Prioritize products that are in stock (stockQuantity > 0).

Recommendations must be valid products from the current inventory. Ensure the suggestions are tailored to the customer's known preferences (if any) or general fashion appeal if no history exists. Focus on items that would complement past purchases or popular current trends in Churidars & Sarees.
`,
});

const customerPurchaseSuggestionsFlow = ai.defineFlow(
  {
    name: 'customerPurchaseSuggestionsFlow',
    inputSchema: CustomerPurchaseSuggestionsInputSchema,
    outputSchema: CustomerPurchaseSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
