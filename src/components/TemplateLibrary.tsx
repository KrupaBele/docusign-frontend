import React, { useState } from "react";
import {
  ArrowLeft,
  Search,
  FileText,
  Shield,
  Briefcase,
  Home,
  Heart,
  Users,
} from "lucide-react";
import { Template } from "../types";

interface TemplateLibraryProps {
  onSelectTemplate: (template: Template) => void;
  onBackToDashboard: () => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  onBackToDashboard,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);

  // Load custom templates from localStorage
  React.useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("${API_UR}/api/templates");
        const data = await res.json();
        setCustomTemplates(
          data.map((tpl: any) => ({
            ...tpl,
            id: tpl._id || tpl.id,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch custom templates:", err);
      }
    };

    fetchTemplates();
  }, []);

  const templates: Template[] = [
    {
      id: "employment-contract",
      title: "Employment Contract",
      category: "HR",
      description: "Standard employment agreement template",
      popular: true,
      content: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into on [DATE] between [COMPANY_NAME], a corporation organized under the laws of [STATE] ("Company"), and [EMPLOYEE_NAME] ("Employee").

1. POSITION AND DUTIES
Employee is hereby employed as [POSITION_TITLE] and agrees to perform the duties and responsibilities associated with this position.

2. COMPENSATION
Employee shall receive a base salary of $ [SALARY_AMOUNT] per year, payable in accordance with Company's standard payroll practices.

3. BENEFITS
Employee shall be entitled to participate in all employee benefit programs maintained by Company.

4. TERM OF EMPLOYMENT
This Agreement shall commence on [START_DATE] and shall continue until terminated in accordance with the provisions herein.

5. CONFIDENTIALITY
Employee acknowledges that during employment, Employee may have access to confidential information.

By signing below, both parties agree to the terms and conditions set forth in this Agreement.

Company Representative: _________________ Date: _______
Employee Signature: _________________ Date: _______`,
    },
    {
      id: "nda-agreement",
      title: "Non-Disclosure Agreement",
      category: "Legal",
      description: "Protect confidential information",
      popular: true,
      content: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into on [DATE] between [COMPANY_NAME] ("Disclosing Party") and [RECIPIENT_NAME] ("Receiving Party").

1. CONFIDENTIAL INFORMATION
The Receiving Party acknowledges that they may have access to confidential and proprietary information.

2. OBLIGATIONS
The Receiving Party agrees to:
- Keep all confidential information strictly confidential
- Not disclose confidential information to third parties
- Use confidential information only for the agreed purpose

3. TERM
This Agreement shall remain in effect for [TERM_LENGTH] years from the date of execution.

4. REMEDIES
The Receiving Party acknowledges that any breach of this Agreement may cause irreparable harm.

Disclosing Party: _________________ Date: _______
Receiving Party: _________________ Date: _______`,
    },
    {
      id: "service-agreement",
      title: "Service Agreement",
      category: "Business",
      description: "Professional services contract",
      content: `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into on [DATE] between [PROVIDER_NAME] ("Service Provider") and [CLIENT_NAME] ("Client").

1. SERVICES
Service Provider agrees to provide the following services: [SERVICE_DESCRIPTION]

2. COMPENSATION
Client agrees to pay Service Provider [PAYMENT_AMOUNT] for the services described herein.

3. TERM
This Agreement shall commence on [START_DATE] and continue until [END_DATE].

4. TERMINATION
Either party may terminate this Agreement with [NOTICE_PERIOD] days written notice.

Service Provider: _________________ Date: _______
Client: _________________ Date: _______`,
    },
    {
      id: "rental-agreement",
      title: "Rental Agreement",
      category: "Real Estate",
      description: "Property rental contract template",
      content: `RENTAL AGREEMENT

This Rental Agreement is entered into on [DATE] between [LANDLORD_NAME] ("Landlord") and [TENANT_NAME] ("Tenant").

1. PROPERTY
Landlord agrees to rent to Tenant the property located at [PROPERTY_ADDRESS].

2. RENT
Tenant agrees to pay monthly rent of $[RENT_AMOUNT] due on the [DUE_DATE] of each month.

3. TERM
This lease shall commence on [START_DATE] and end on [END_DATE].

4. DEPOSIT
Tenant shall pay a security deposit of $[DEPOSIT_AMOUNT].

Landlord: _________________ Date: _______
Tenant: _________________ Date: _______`,
    },
    {
      id: "wedding-contract",
      title: "Wedding Contract",
      category: "Personal",
      description: "Wedding vendor agreement",
      content: `WEDDING VENDOR AGREEMENT

This Agreement is entered into on [DATE] between [VENDOR_NAME] ("Vendor") and [CLIENT_NAME] ("Client").

1. SERVICES
Vendor agrees to provide wedding services on [WEDDING_DATE] at [VENUE_NAME].

2. PAYMENT
Total contract amount: $[TOTAL_AMOUNT]
Deposit: $[DEPOSIT_AMOUNT] (due upon signing)
Balance: $[BALANCE_AMOUNT] (due [BALANCE_DUE_DATE])

3. CANCELLATION
Cancellation policy: [CANCELLATION_TERMS]

Vendor: _________________ Date: _______
Client: _________________ Date: _______`,
    },
    {
      id: "freelance-contract",
      title: "Freelance Contract",
      category: "Business",
      description: "Independent contractor agreement",
      popular: true,
      content: `FREELANCE CONTRACT

This Freelance Contract is entered into on [DATE] between [CLIENT_NAME] ("Client") and [FREELANCER_NAME] ("Freelancer").

1. SCOPE OF WORK
Freelancer agrees to provide the following services: [WORK_DESCRIPTION]

2. PAYMENT
Total project cost: $[PROJECT_AMOUNT]
Payment schedule: [PAYMENT_SCHEDULE]

3. TIMELINE
Project start date: [START_DATE]
Project completion date: [END_DATE]

4. INTELLECTUAL PROPERTY
All work product shall be owned by [IP_OWNER].

Client: _________________ Date: _______
Freelancer: _________________ Date: _______`,
    },
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "HR":
        return <Users className="w-5 h-5 text-blue-600" />;
      case "Legal":
        return <Shield className="w-5 h-5 text-blue-600" />;
      case "Business":
        return <Briefcase className="w-5 h-5 text-blue-600" />;
      case "Real Estate":
        return <Home className="w-5 h-5 text-blue-600" />;
      case "Personal":
        return <Heart className="w-5 h-5 text-blue-600" />;
      default:
        return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  const allTemplates = [...templates, ...customTemplates];
  const filteredTemplates = allTemplates.filter(
    (template) =>
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={onBackToDashboard}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <FileText className="w-6 h-6 text-blue-600 mr-2" />
            <span className="text-lg font-semibold text-gray-900">
              Template Library
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title and Search */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Choose a Template
          </h1>
          <p className="text-gray-600 mb-6">
            Start with a pre-made template and customize it for your needs.
          </p>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {getCategoryIcon(template.category)}
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.title}
                      </h3>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-500">
                          {template.category}
                        </span>
                        {template.popular && (
                          <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                            Popular
                          </span>
                        )}
                        {template.category === "Custom" && (
                          <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-6">
                  {template.description}
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => onSelectTemplate(template)}
                    className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-150 text-sm font-medium"
                  >
                    Use Template
                  </button>
                  <button className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
                    Preview
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default TemplateLibrary;
