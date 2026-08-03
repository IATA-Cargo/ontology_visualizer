import { TableConfig } from "../../../Visualizer/types";

import abstractLogisticsActionTable from "./tables/Abstract.LogisticsAction.json";
import abstractLogisticsActivityTable from "./tables/Abstract.LogisticsActivity.json";
import abstractLogisticsAgentTable from "./tables/Abstract.LogisticsAgent.json";
import abstractLogisticsObjectTable from "./tables/Abstract.LogisticsObject.json";
import abstractLogisticsServiceTable from "./tables/Abstract.LogisticsService.json";
import abstractPhysicalLogisticsObjectTable from "./tables/Abstract.PhysicalLogisticsObject.json";
import actionCheckTable from "./tables/Action.Check.json";
import actionComposingTable from "./tables/Action.Composing.json";
import actionLoadingTable from "./tables/Action.Loading.json";
import actionStoringTable from "./tables/Action.Storing.json";
import activityStorageTable from "./tables/Activity.Storage.json";
import activityTransportMovementTable from "./tables/Activity.TransportMovement.json";
import activityUnitCompositionTable from "./tables/Activity.UnitComposition.json";
import agentActorTable from "./tables/Agent.Actor.json";
import agentCarrierTable from "./tables/Agent.Carrier.json";
import agentCompanyTable from "./tables/Agent.Company.json";
import agentNonHumanActorTable from "./tables/Agent.NonHumanActor.json";
import agentOrganizationTable from "./tables/Agent.Organization.json";
import agentPersonTable from "./tables/Agent.Person.json";
import agentPublicAuthorityTable from "./tables/Agent.PublicAuthority.json";
import billingSettlementBillingDetailsTable from "./tables/BillingSettlement.BillingDetails.json";
import commonAnswerTable from "./tables/Common.Answer.json";
import commonCheckTemplateTable from "./tables/Common.CheckTemplate.json";
import commonCheckTotalResultTable from "./tables/Common.CheckTotalResult.json";
import commonExternalReferenceTable from "./tables/Common.ExternalReference.json";
import commonIotDeviceTable from "./tables/Common.IotDevice.json";
import commonLoadingMaterialTable from "./tables/Common.LoadingMaterial.json";
import commonLoadingUnitTable from "./tables/Common.LoadingUnit.json";
import commonLocationTable from "./tables/Common.Location.json";
import commonQuestionTable from "./tables/Common.Question.json";
import commonSensorTable from "./tables/Common.Sensor.json";
import coreCO2EmissionsTable from "./tables/Core.CO2Emissions.json";
import coreCustomsInformationTable from "./tables/Core.CustomsInformation.json";
import coreInsuranceTable from "./tables/Core.Insurance.json";
import coreItemTable from "./tables/Core.Item.json";
import corePackagingTypeTable from "./tables/Core.PackagingType.json";
import corePieceTable from "./tables/Core.Piece.json";
import coreProductTable from "./tables/Core.Product.json";
import coreSecurityDeclarationTable from "./tables/Core.SecurityDeclaration.json";
import coreShipmentTable from "./tables/Core.Shipment.json";
import coreTransportMeansTable from "./tables/Core.TransportMeans.json";
import coreULDTable from "./tables/Core.ULD.json";
import coreWaybillTable from "./tables/Core.Waybill.json";
import dGDgDeclarationTable from "./tables/DG.DgDeclaration.json";
import dGDgProductRadioactiveTable from "./tables/DG.DgProductRadioactive.json";
import dGDgRadioactiveIsotopeTable from "./tables/DG.DgRadioactiveIsotope.json";
import dGItemDgTable from "./tables/DG.ItemDg.json";
import dGPieceDgTable from "./tables/DG.PieceDg.json";
import dGProductDgTable from "./tables/DG.ProductDg.json";
import distributionBookingOptionTable from "./tables/Distribution.BookingOption.json";
import distributionBookingOptionRequestTable from "./tables/Distribution.BookingOptionRequest.json";
import distributionBookingRequestTable from "./tables/Distribution.BookingRequest.json";
import distributionBookingShipmentTable from "./tables/Distribution.BookingShipment.json";
import distributionPriceTable from "./tables/Distribution.Price.json";
import distributionRatingsTable from "./tables/Distribution.Ratings.json";
import distributionTransportLegsTable from "./tables/Distribution.TransportLegs.json";
import embeddedAccountingNoteTable from "./tables/Embedded.AccountingNote.json";
import embeddedAccountNumberTable from "./tables/Embedded.AccountNumber.json";
import embeddedActivitySequenceTable from "./tables/Embedded.ActivitySequence.json";
import embeddedAddressTable from "./tables/Embedded.Address.json";
import embeddedAdjustmentsTable from "./tables/Embedded.Adjustments.json";
import embeddedBookingPreferencesTable from "./tables/Embedded.BookingPreferences.json";
import embeddedBookingSegmentTable from "./tables/Embedded.BookingSegment.json";
import embeddedBookingTimesTable from "./tables/Embedded.BookingTimes.json";
import embeddedCarrierProductTable from "./tables/Embedded.CarrierProduct.json";
import embeddedCharacteristicTable from "./tables/Embedded.Characteristic.json";
import embeddedCodeListElementTable from "./tables/Embedded.CodeListElement.json";
import embeddedContactDetailTable from "./tables/Embedded.ContactDetail.json";
import embeddedCurrencyValueTable from "./tables/Embedded.CurrencyValue.json";
import embeddedDimensionsTable from "./tables/Embedded.Dimensions.json";
import embeddedGeolocationTable from "./tables/Embedded.Geolocation.json";
import embeddedLineItemPackageTable from "./tables/Embedded.LineItemPackage.json";
import embeddedLoosePieceTable from "./tables/Embedded.LoosePiece.json";
import embeddedMeasurementTable from "./tables/Embedded.Measurement.json";
import embeddedMovementTimeTable from "./tables/Embedded.MovementTime.json";
import embeddedOtherChargeTable from "./tables/Embedded.OtherCharge.json";
import embeddedOtherIdentifierTable from "./tables/Embedded.OtherIdentifier.json";
import embeddedPartyTable from "./tables/Embedded.Party.json";
import embeddedPieceGroupTable from "./tables/Embedded.PieceGroup.json";
import embeddedRangesTable from "./tables/Embedded.Ranges.json";
import embeddedRegulatedEntityTable from "./tables/Embedded.RegulatedEntity.json";
import embeddedStationRemarksTable from "./tables/Embedded.StationRemarks.json";
import embeddedTemperatureInstructionsTable from "./tables/Embedded.TemperatureInstructions.json";
import embeddedULDBasicPieceTable from "./tables/Embedded.ULDBasicPiece.json";
import embeddedULDSpecificPieceTable from "./tables/Embedded.ULDSpecificPiece.json";
import embeddedUnitsPreferenceTable from "./tables/Embedded.UnitsPreference.json";
import embeddedValueTable from "./tables/Embedded.Value.json";
import embeddedVolumePieceGroupTable from "./tables/Embedded.VolumePieceGroup.json";
import embeddedVolumetricWeightTable from "./tables/Embedded.VolumetricWeight.json";
import embeddedWaybillLineItemTable from "./tables/Embedded.WaybillLineItem.json";
import eventLogisticsEventTable from "./tables/Event.LogisticsEvent.json";
import liveAnimalsEpermitConsignmentTable from "./tables/LiveAnimals.EpermitConsignment.json";
import liveAnimalsEpermitSignatureTable from "./tables/LiveAnimals.EpermitSignature.json";
import liveAnimalsLiveAnimalsEpermitTable from "./tables/LiveAnimals.LiveAnimalsEpermit.json";
import liveAnimalsPieceLiveAnimalsTable from "./tables/LiveAnimals.PieceLiveAnimals.json";
import serviceBookingTable from "./tables/Service.Booking.json";
import serviceHandlingServiceTable from "./tables/Service.HandlingService.json";

const tables: TableConfig[] = [
  abstractLogisticsActionTable,
  abstractLogisticsActivityTable,
  abstractLogisticsAgentTable,
  abstractLogisticsObjectTable,
  abstractLogisticsServiceTable,
  abstractPhysicalLogisticsObjectTable,
  actionCheckTable,
  actionComposingTable,
  actionLoadingTable,
  actionStoringTable,
  activityStorageTable,
  activityTransportMovementTable,
  activityUnitCompositionTable,
  agentActorTable,
  agentCarrierTable,
  agentCompanyTable,
  agentNonHumanActorTable,
  agentOrganizationTable,
  agentPersonTable,
  agentPublicAuthorityTable,
  billingSettlementBillingDetailsTable,
  commonAnswerTable,
  commonCheckTemplateTable,
  commonCheckTotalResultTable,
  commonExternalReferenceTable,
  commonIotDeviceTable,
  commonLoadingMaterialTable,
  commonLoadingUnitTable,
  commonLocationTable,
  commonQuestionTable,
  commonSensorTable,
  coreCO2EmissionsTable,
  coreCustomsInformationTable,
  coreInsuranceTable,
  coreItemTable,
  corePackagingTypeTable,
  corePieceTable,
  coreProductTable,
  coreSecurityDeclarationTable,
  coreShipmentTable,
  coreTransportMeansTable,
  coreULDTable,
  coreWaybillTable,
  dGDgDeclarationTable,
  dGDgProductRadioactiveTable,
  dGDgRadioactiveIsotopeTable,
  dGItemDgTable,
  dGPieceDgTable,
  dGProductDgTable,
  distributionBookingOptionTable,
  distributionBookingOptionRequestTable,
  distributionBookingRequestTable,
  distributionBookingShipmentTable,
  distributionPriceTable,
  distributionRatingsTable,
  distributionTransportLegsTable,
  embeddedAccountingNoteTable,
  embeddedAccountNumberTable,
  embeddedActivitySequenceTable,
  embeddedAddressTable,
  embeddedAdjustmentsTable,
  embeddedBookingPreferencesTable,
  embeddedBookingSegmentTable,
  embeddedBookingTimesTable,
  embeddedCarrierProductTable,
  embeddedCharacteristicTable,
  embeddedCodeListElementTable,
  embeddedContactDetailTable,
  embeddedCurrencyValueTable,
  embeddedDimensionsTable,
  embeddedGeolocationTable,
  embeddedLineItemPackageTable,
  embeddedLoosePieceTable,
  embeddedMeasurementTable,
  embeddedMovementTimeTable,
  embeddedOtherChargeTable,
  embeddedOtherIdentifierTable,
  embeddedPartyTable,
  embeddedPieceGroupTable,
  embeddedRangesTable,
  embeddedRegulatedEntityTable,
  embeddedStationRemarksTable,
  embeddedTemperatureInstructionsTable,
  embeddedULDBasicPieceTable,
  embeddedULDSpecificPieceTable,
  embeddedUnitsPreferenceTable,
  embeddedValueTable,
  embeddedVolumePieceGroupTable,
  embeddedVolumetricWeightTable,
  embeddedWaybillLineItemTable,
  eventLogisticsEventTable,
  liveAnimalsEpermitConsignmentTable,
  liveAnimalsEpermitSignatureTable,
  liveAnimalsLiveAnimalsEpermitTable,
  liveAnimalsPieceLiveAnimalsTable,
  serviceBookingTable,
  serviceHandlingServiceTable
];

export default tables;
