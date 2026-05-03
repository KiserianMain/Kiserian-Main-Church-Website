import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_form_builder/flutter_form_builder.dart';
import 'package:form_builder_validators/form_builder_validators.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/api_service.dart';
import '../widgets/loading_button.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/payment_method_card.dart';

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key});

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  final _formKey = GlobalKey<FormBuilderState>();
  final _amountController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isLoading = false;
  String _selectedCategory = 'Tithe';
  String _paymentMethod = 'STK Push';

  final List<String> _categories = [
    'Tithe',
    'Offering',
    'Sabbath School Offering',
    'Camp Meeting Offering',
    'Building Fund',
    'Education Fund',
    'Health Ministries',
    'Family Ministries',
    'Youth Ministries',
  ];

  final List<String> _paymentMethods = [
    'STK Push',
    'Payment Link',
    'QR Code',
  ];

  @override
  void dispose() {
    _amountController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _initiatePayment() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final apiService = ApiService();
      
      Map<String, dynamic> paymentData = {
        'amount': double.parse(_amountController.text),
        'category': _selectedCategory,
        'description': '$_selectedCategory payment',
      };

      // Add phone number for STK Push
      if (_paymentMethod == 'STK Push') {
        paymentData['phoneNumber'] = _phoneController.text;
      }

      Map<String, dynamic> result;

      switch (_paymentMethod) {
        case 'STK Push':
          result = await _initiateSTKPush(paymentData);
          break;
        case 'Payment Link':
          result = await _generatePaymentLink(paymentData);
          break;
        case 'QR Code':
          result = await _generateQRCode(paymentData);
          break;
        default:
          result = {'success': false, 'error': 'Invalid payment method'};
      }

      if (result['success']) {
        _showPaymentSuccess(result);
      } else {
        _showPaymentError(result['error']);
      }
    } catch (e) {
      _showPaymentError('Payment failed: ${e.toString()}');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<Map<String, dynamic>> _initiateSTKPush(Map<String, dynamic> paymentData) async {
    try {
      final response = await ApiService().dio.post('/payments/initiate', data: paymentData);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Payment initiated. Check your phone for M-Pesa prompt.',
          'transactionId': response.data['data']['transactionId'],
        };
      }
      
      return {'success': false, 'error': 'Failed to initiate payment'};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> _generatePaymentLink(Map<String, dynamic> paymentData) async {
    try {
      final response = await ApiService().dio.post('/payments/payment-link', data: paymentData);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'paymentUrl': response.data['data']['paymentUrl'],
          'expiresAt': response.data['data']['expiresAt'],
        };
      }
      
      return {'success': false, 'error': 'Failed to generate payment link'};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> _generateQRCode(Map<String, dynamic> paymentData) async {
    try {
      final response = await ApiService().dio.post('/payments/qr-code', data: paymentData);
      
      if (response.statusCode == 200) {
        return {
          'success': true,
          'qrCodeData': response.data['data']['qrCodeData'],
          'qrCodeImage': response.data['data']['qrCodeImage'],
        };
      }
      
      return {'success': false, 'error': 'Failed to generate QR code'};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  void _showPaymentSuccess(Map<String, dynamic> result) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Payment Initiated'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(result['message']),
            if (result['paymentUrl'] != null) ...[
              const SizedBox(height: 16),
              const Text('Payment Link:'),
              const SizedBox(height: 8),
              SelectableText(
                result['paymentUrl'],
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.blue,
                  decoration: TextDecoration.underline,
                ),
              ),
            ],
          ],
        ),
        actions: [
          if (result['paymentUrl'] != null)
            TextButton(
              onPressed: () async {
                final uri = Uri.parse(result['paymentUrl']);
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                }
              },
              child: const Text('Open Link'),
            ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showPaymentError(String error) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(error),
        backgroundColor: Theme.of(context).colorScheme.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Make Payment'),
        backgroundColor: Theme.of(context).colorScheme.background,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Payment Method Selection
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Payment Method',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 12),
                    ...List.generate(
                      _paymentMethods.length,
                      (index) => PaymentMethodCard(
                        title: _paymentMethods[index],
                        subtitle: _getPaymentMethodDescription(_paymentMethods[index]),
                        icon: _getPaymentMethodIcon(_paymentMethods[index]),
                        isSelected: _paymentMethod == _paymentMethods[index],
                        onTap: () {
                          setState(() => _paymentMethod = _paymentMethods[index]);
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Payment Form
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: FormBuilder(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Amount Field
                      CustomTextField(
                        name: 'amount',
                        controller: _amountController,
                        label: 'Amount (KES)',
                        prefixIcon: Icons.money,
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                        ],
                        validator: FormBuilderValidators.compose([
                          FormBuilderValidators.required(
                            errorText: 'Please enter amount',
                          ),
                          FormBuilderValidators.min(1,
                            errorText: 'Amount must be greater than 0'),
                        ]),
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Category Dropdown
                      DropdownButtonFormField<String>(
                        value: _selectedCategory,
                        decoration: const InputDecoration(
                          labelText: 'Payment Category',
                          prefixIcon: Icon(Icons.category),
                          border: OutlineInputBorder(),
                        ),
                        items: _categories.map((category) {
                          return DropdownMenuItem(
                            value: category,
                            child: Text(category),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() => _selectedCategory = value!);
                        },
                      ),
                      
                      if (_paymentMethod == 'STK Push') ...[
                        const SizedBox(height: 16),
                        
                        // Phone Number Field
                        CustomTextField(
                          name: 'phoneNumber',
                          controller: _phoneController,
                          label: 'Phone Number',
                          prefixIcon: Icons.phone,
                          keyboardType: TextInputType.phone,
                          hintText: '2547XXXXXXXX',
                          validator: FormBuilderValidators.compose([
                            FormBuilderValidators.required(
                              errorText: 'Please enter phone number',
                            ),
                            FormBuilderValidators.match(
                              r'^2547\d{8}$',
                              errorText: 'Enter valid number: 2547XXXXXXXX',
                            ),
                          ]),
                        ),
                      ],
                      
                      const SizedBox(height: 24),
                      
                      // Payment Button
                      LoadingButton(
                        onPressed: _initiatePayment,
                        isLoading: _isLoading,
                        text: 'Pay KES ${_amountController.text.isEmpty ? '0' : _amountController.text}',
                        fullWidth: true,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Payment Info Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.info_outline,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Payment Information',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '• Payments are processed securely via M-Pesa\n'
                      '• You will receive a confirmation SMS\n'
                      '• Payment links expire after 24 hours\n'
                      '• QR codes can be scanned with any M-Pesa app',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getPaymentMethodDescription(String method) {
    switch (method) {
      case 'STK Push':
        return 'Receive M-Pesa prompt on your phone';
      case 'Payment Link':
        return 'Get a payment link to share or use';
      case 'QR Code':
        return 'Scan QR code with M-Pesa app';
      default:
        return '';
    }
  }

  IconData _getPaymentMethodIcon(String method) {
    switch (method) {
      case 'STK Push':
        return Icons.phone_android;
      case 'Payment Link':
        return Icons.link;
      case 'QR Code':
        return Icons.qr_code_scanner;
      default:
        return Icons.payment;
    }
  }
}
