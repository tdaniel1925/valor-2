'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function ContactSupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    alert('Support request submitted successfully! Our team will respond within 24 hours.');
    setFormData({
      name: '',
      email: '',
      subject: '',
      category: '',
      message: '',
    });
    setIsSubmitting(false);
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Contact Support
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Need help? Our support team is here to assist you
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Submit a Support Request</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Smith"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="account">Account & Billing</SelectItem>
                        <SelectItem value="product">Product Question</SelectItem>
                        <SelectItem value="training">Training & Resources</SelectItem>
                        <SelectItem value="commission">Commission Question</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please provide as much detail as possible..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information Sidebar */}
          <div className="space-y-6">
            {/* Contact Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Phone Support</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">1-800-VALOR-HQ</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">(1-800-825-6747)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Email Support</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">support@valor-insurance.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Live Chat</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Available Mon-Fri, 9am-5pm ET</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Office Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Support Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold">Monday - Friday</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">8am - 8pm ET</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold">Saturday</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">10am - 4pm ET</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Sunday</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Closed</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Office Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Headquarters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Valor Insurance Platform</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      123 Insurance Boulevard<br />
                      Suite 500<br />
                      New York, NY 10001
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/help" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Help Center
                </Link>
                <Link href="/help/videos" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Video Tutorials
                </Link>
                <Link href="/community" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Community Forum
                </Link>
                <Link href="/training" className="block text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Training Portal
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
