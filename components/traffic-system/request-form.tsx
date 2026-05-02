"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  VehicleType,
  RequestCategory,
  IncidentSeverity,
  TrafficDensity,
  TrafficRequest,
} from "@/lib/traffic-system/types";
import { getValidLocations, generateRequestId } from "@/lib/traffic-system/modules/preprocessing";
import { 
  Car, 
  Ambulance, 
  FireExtinguisher, 
  Shield, 
  Send,
  MapPin,
  Target,
  AlertTriangle,
  Timer,
  Gauge
} from "lucide-react";

interface RequestFormProps {
  onSubmit: (request: Partial<TrafficRequest>) => void;
  isLoading?: boolean;
}

export function RequestForm({ onSubmit, isLoading = false }: RequestFormProps) {
  const locations = getValidLocations();

  const [formData, setFormData] = useState({
    vehicleType: VehicleType.CIVILIAN,
    requestCategory: RequestCategory.ROUTE_REQUEST,
    currentLocation: "",
    destination: "",
    incidentSeverity: IncidentSeverity.MEDIUM,
    timeSensitivity: false,
    trafficDensity: TrafficDensity.MEDIUM,
    controlZone: "",
    descriptionNote: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const request: Partial<TrafficRequest> = {
      requestId: generateRequestId(),
      vehicleType: formData.vehicleType,
      requestCategory: formData.requestCategory,
      currentLocation: formData.currentLocation,
      destination: formData.destination,
      incidentSeverity: formData.incidentSeverity,
      timeSensitivity: formData.timeSensitivity,
      trafficDensity: formData.trafficDensity,
      controlZone: formData.controlZone || undefined,
      descriptionNote: formData.descriptionNote || undefined,
      timestamp: new Date(),
    };

    onSubmit(request);
  };

  const isEmergencyCategory =
    formData.requestCategory === RequestCategory.EMERGENCY_RESPONSE_REQUEST ||
    formData.requestCategory === RequestCategory.INTEGRATED_CITY_SERVICE_REQUEST;

  const needsControlZone =
    formData.requestCategory === RequestCategory.CONTROL_ALLOCATION_REQUEST ||
    formData.requestCategory === RequestCategory.POLICY_CHECK;

  const getVehicleIcon = (type: VehicleType) => {
    switch (type) {
      case VehicleType.AMBULANCE:
        return <Ambulance className="h-4 w-4" />;
      case VehicleType.FIRE_UNIT:
        return <FireExtinguisher className="h-4 w-4" />;
      case VehicleType.POLICE:
        return <Shield className="h-4 w-4" />;
      default:
        return <Car className="h-4 w-4" />;
    }
  };

  const formatLocationName = (loc: string) => 
    loc.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Card className="border-border/50 h-fit">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              New Request
            </CardTitle>
            <CardDescription className="mt-1">
              Submit a traffic or emergency request
            </CardDescription>
          </div>
          {isEmergencyCategory && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Emergency
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Vehicle Type Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Vehicle Type
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {Object.values(VehicleType).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, vehicleType: type })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-all ${
                    formData.vehicleType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 hover:border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {getVehicleIcon(type)}
                  <span className="capitalize text-[10px]">
                    {type.replace("_", " ")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Request Category */}
          <div className="space-y-2">
            <Label htmlFor="requestCategory" className="text-xs text-muted-foreground uppercase tracking-wide">
              Request Category
            </Label>
            <Select
              value={formData.requestCategory}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  requestCategory: value as RequestCategory,
                })
              }
            >
              <SelectTrigger id="requestCategory" className="bg-muted/30">
                <SelectValue placeholder="Select request category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RequestCategory.ROUTE_REQUEST}>
                  Route Request
                </SelectItem>
                <SelectItem value={RequestCategory.POLICY_CHECK}>
                  Policy Check
                </SelectItem>
                <SelectItem value={RequestCategory.CONTROL_ALLOCATION_REQUEST}>
                  Control Allocation
                </SelectItem>
                <SelectItem value={RequestCategory.EMERGENCY_RESPONSE_REQUEST}>
                  Emergency Response
                </SelectItem>
                <SelectItem value={RequestCategory.INTEGRATED_CITY_SERVICE_REQUEST}>
                  Integrated City Service
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-4" />

          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <MapPin className="h-3 w-3" />
              Locations
            </div>

            {/* Current Location */}
            <div className="space-y-2">
              <Label htmlFor="currentLocation" className="text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Origin
              </Label>
              <Select
                value={formData.currentLocation}
                onValueChange={(value) =>
                  setFormData({ ...formData, currentLocation: value })
                }
              >
                <SelectTrigger id="currentLocation" className="bg-muted/30">
                  <SelectValue placeholder="Select start location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {formatLocationName(loc)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label htmlFor="destination" className="text-sm flex items-center gap-2">
                <Target className="h-3 w-3 text-destructive" />
                Destination
              </Label>
              <Select
                value={formData.destination}
                onValueChange={(value) =>
                  setFormData({ ...formData, destination: value })
                }
              >
                <SelectTrigger id="destination" className="bg-muted/30">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {formatLocationName(loc)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Control Zone (conditional) */}
          {needsControlZone && (
            <div className="space-y-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
              <Label htmlFor="controlZone" className="text-sm">Control Zone</Label>
              <Select
                value={formData.controlZone}
                onValueChange={(value) =>
                  setFormData({ ...formData, controlZone: value })
                }
              >
                <SelectTrigger id="controlZone" className="bg-muted/30">
                  <SelectValue placeholder="Select control zone" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {formatLocationName(loc)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Emergency Severity (conditional) */}
          {isEmergencyCategory && (
            <div className="space-y-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <Label htmlFor="incidentSeverity" className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                Incident Severity
              </Label>
              <Select
                value={formData.incidentSeverity}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    incidentSeverity: value as IncidentSeverity,
                  })
                }
              >
                <SelectTrigger id="incidentSeverity" className="bg-muted/30">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={IncidentSeverity.LOW}>Low</SelectItem>
                  <SelectItem value={IncidentSeverity.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={IncidentSeverity.HIGH}>High</SelectItem>
                  <SelectItem value={IncidentSeverity.CRITICAL}>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator className="my-4" />

          {/* Conditions Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <Gauge className="h-3 w-3" />
              Conditions
            </div>

            {/* Traffic Density */}
            <div className="space-y-2">
              <Label htmlFor="trafficDensity" className="text-sm">
                Current Traffic Density
              </Label>
              <Select
                value={formData.trafficDensity}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    trafficDensity: value as TrafficDensity,
                  })
                }
              >
                <SelectTrigger id="trafficDensity" className="bg-muted/30">
                  <SelectValue placeholder="Select traffic density" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TrafficDensity.LOW}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value={TrafficDensity.MEDIUM}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value={TrafficDensity.HIGH}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      High
                    </span>
                  </SelectItem>
                  <SelectItem value={TrafficDensity.CONGESTED}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Congested
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Sensitivity Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="timeSensitivity" className="text-sm cursor-pointer">
                  Time Sensitive
                </Label>
              </div>
              <Switch
                id="timeSensitivity"
                checked={formData.timeSensitivity}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, timeSensitivity: checked })
                }
              />
            </div>
          </div>

          {/* Description Note */}
          <div className="space-y-2">
            <Label htmlFor="descriptionNote" className="text-xs text-muted-foreground uppercase tracking-wide">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="descriptionNote"
              placeholder="Add any relevant details..."
              value={formData.descriptionNote}
              onChange={(e) =>
                setFormData({ ...formData, descriptionNote: e.target.value })
              }
              rows={2}
              className="bg-muted/30 resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-11 font-medium" 
            disabled={isLoading || !formData.currentLocation || !formData.destination}
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Processing Request...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
