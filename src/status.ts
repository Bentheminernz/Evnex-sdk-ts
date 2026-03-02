export enum DeviceStatus {
    OFFLINE = "OFFLINE",
    AVAILABLE = "AVAILABLE",
    PREPARING = "PREPARING",
    CHARGING = "CHARGING",
    SUSPENDED_EVSE = "SUSPENDED_EVSE",
    SUSPENDED_EV = "SUSPENDED_EV",
    FINISHING = "FINISHING",
    RESERVED = "RESERVED",
    UNAVAILABLE = "UNAVAILABLE",
    FAULTED = "FAULTED",
}

export const ConnectorOcppStatus: Record<DeviceStatus, string> = {
    [DeviceStatus.AVAILABLE]: "Available",
    [DeviceStatus.CHARGING]: "Charging",
    [DeviceStatus.FAULTED]: "Faulted",
    [DeviceStatus.FINISHING]: "Finished Charging - unplug charghe point",
    [DeviceStatus.PREPARING]: "Preparing to charge",
    [DeviceStatus.RESERVED]: "Reserved",
    [DeviceStatus.SUSPENDED_EV]: "The vehicle is not currently requesting energy",
    [DeviceStatus.SUSPENDED_EVSE]: "Charging has been paused by the charge point",
    [DeviceStatus.UNAVAILABLE]: "Disabled",
    [DeviceStatus.OFFLINE]: "Offline",
}