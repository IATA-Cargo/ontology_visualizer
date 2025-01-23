import { TableConfig } from "../../../Visualizer/types";

import embeddedAccountingNoteTable from "./tables/Embedded.AccountingNote.json";
import embeddedActivitySequenceTable from "./tables/Embedded.ActivitySequence.json";
import agentActorTable from "./tables/Agent.Actor.json";
import embeddedAddressTable from "./tables/Embedded.Address.json";
import embeddedAdjustmentsTable from "./tables/Embedded.Adjustments.json";
import commonAnswerTable from "./tables/Common.Answer.json";
import billingSettlementBillingDetailsTable from "./tables/BillingSettlement.BillingDetails.json";
import serviceBookingTable from "./tables/Service.Booking.json";
import distributionBookingOptionTable from "./tables/Distribution.BookingOption.json";
import distributionBookingOptionRequestTable from "./tables/Distribution.BookingOptionRequest.json";
import embeddedBookingPreferencesTable from "./tables/Embedded.BookingPreferences.json";
import distributionBookingRequestTable from "./tables/Distribution.BookingRequest.json";
import distributionBookingShipmentTable from "./tables/Distribution.BookingShipment.json";
import embeddedBookingTimesTable from "./tables/Embedded.BookingTimes.json";
import coreCO2EmissionsTable from "./tables/Core.CO2Emissions.json";
import agentCarrierTable from "./tables/Agent.Carrier.json";
import embeddedCarrierProductTable from "./tables/Embedded.CarrierProduct.json";
import embeddedCharacteristicTable from "./tables/Embedded.Characteristic.json";
import actionCheckTable from "./tables/Action.Check.json";
import commonCheckTemplateTable from "./tables/Common.CheckTemplate.json";
import commonCheckTotalResultTable from "./tables/Common.CheckTotalResult.json";
import embeddedCodeListElementTable from "./tables/Embedded.CodeListElement.json";
import agentCompanyTable from "./tables/Agent.Company.json";
import actionComposingTable from "./tables/Action.Composing.json";
import embeddedContactDetailTable from "./tables/Embedded.ContactDetail.json";
import embeddedCurrencyValueTable from "./tables/Embedded.CurrencyValue.json";
import coreCustomsInformationTable from "./tables/Core.CustomsInformation.json";
import dGDgDeclarationTable from "./tables/DG.DgDeclaration.json";
import dGDgProductRadioactiveTable from "./tables/DG.DgProductRadioactive.json";
import dGDgRadioactiveIsotopeTable from "./tables/DG.DgRadioactiveIsotope.json";
import embeddedDimensionsTable from "./tables/Embedded.Dimensions.json";
import liveAnimalsEpermitConsignmentTable from "./tables/LiveAnimals.EpermitConsignment.json";
import liveAnimalsEpermitSignatureTable from "./tables/LiveAnimals.EpermitSignature.json";
import commonExternalReferenceTable from "./tables/Common.ExternalReference.json";
import embeddedGeolocationTable from "./tables/Embedded.Geolocation.json";
import coreInsuranceTable from "./tables/Core.Insurance.json";
import commonIotDeviceTable from "./tables/Common.IotDevice.json";
import coreItemTable from "./tables/Core.Item.json";
import dGItemDgTable from "./tables/DG.ItemDg.json";
import liveAnimalsLiveAnimalsEpermitTable from "./tables/LiveAnimals.LiveAnimalsEpermit.json";
import actionLoadingTable from "./tables/Action.Loading.json";
import commonLoadingMaterialTable from "./tables/Common.LoadingMaterial.json";
import commonLoadingUnitTable from "./tables/Common.LoadingUnit.json";
import commonLocationTable from "./tables/Common.Location.json";
import abstractLogisticsActionTable from "./tables/Abstract.LogisticsAction.json";
import abstractLogisticsActivityTable from "./tables/Abstract.LogisticsActivity.json";
import abstractLogisticsAgentTable from "./tables/Abstract.LogisticsAgent.json";
import eventLogisticsEventTable from "./tables/Event.LogisticsEvent.json";
import abstractLogisticsObjectTable from "./tables/Abstract.LogisticsObject.json";
import abstractLogisticsServiceTable from "./tables/Abstract.LogisticsService.json";
import embeddedLoosePieceTable from "./tables/Embedded.LoosePiece.json";
import embeddedMeasurementTable from "./tables/Embedded.Measurement.json";
import embeddedMovementTimeTable from "./tables/Embedded.MovementTime.json";
import agentNonHumanActorTable from "./tables/Agent.NonHumanActor.json";
import agentOrganizationTable from "./tables/Agent.Organization.json";
import embeddedOtherChargeTable from "./tables/Embedded.OtherCharge.json";
import embeddedOtherIdentifierTable from "./tables/Embedded.OtherIdentifier.json";
import corePackagingTypeTable from "./tables/Core.PackagingType.json";
import embeddedPartyTable from "./tables/Embedded.Party.json";
import agentPersonTable from "./tables/Agent.Person.json";
import abstractPhysicalLogisticsObjectTable from "./tables/Abstract.PhysicalLogisticsObject.json";
import corePieceTable from "./tables/Core.Piece.json";
import dGPieceDgTable from "./tables/DG.PieceDg.json";
import embeddedPieceGroupTable from "./tables/Embedded.PieceGroup.json";
import liveAnimalsPieceLiveAnimalsTable from "./tables/LiveAnimals.PieceLiveAnimals.json";
import distributionPriceTable from "./tables/Distribution.Price.json";
import coreProductTable from "./tables/Core.Product.json";
import dGProductDgTable from "./tables/DG.ProductDg.json";
import agentPublicAuthorityTable from "./tables/Agent.PublicAuthority.json";
import commonQuestionTable from "./tables/Common.Question.json";
import embeddedRangesTable from "./tables/Embedded.Ranges.json";
import distributionRatingsTable from "./tables/Distribution.Ratings.json";
import embeddedRegulatedEntityTable from "./tables/Embedded.RegulatedEntity.json";
import coreSecurityDeclarationTable from "./tables/Core.SecurityDeclaration.json";
import commonSensorTable from "./tables/Common.Sensor.json";
import coreShipmentTable from "./tables/Core.Shipment.json";
import embeddedStationRemarksTable from "./tables/Embedded.StationRemarks.json";
import activityStorageTable from "./tables/Activity.Storage.json";
import actionStoringTable from "./tables/Action.Storing.json";
import embeddedTemperatureInstructionsTable from "./tables/Embedded.TemperatureInstructions.json";
import distributionTransportLegsTable from "./tables/Distribution.TransportLegs.json";
import coreTransportMeansTable from "./tables/Core.TransportMeans.json";
import activityTransportMovementTable from "./tables/Activity.TransportMovement.json";
import coreULDTable from "./tables/Core.ULD.json";
import embeddedULDBasicPieceTable from "./tables/Embedded.ULDBasicPiece.json";
import embeddedULDSpecificPieceTable from "./tables/Embedded.ULDSpecificPiece.json";
import activityUnitCompositionTable from "./tables/Activity.UnitComposition.json";
import embeddedUnitsPreferenceTable from "./tables/Embedded.UnitsPreference.json";
import embeddedValueTable from "./tables/Embedded.Value.json";
import embeddedVolumePieceGroupTable from "./tables/Embedded.VolumePieceGroup.json";
import embeddedVolumetricWeightTable from "./tables/Embedded.VolumetricWeight.json";
import coreWaybillTable from "./tables/Core.Waybill.json";
import embeddedWaybillLineItemTable from "./tables/Embedded.WaybillLineItem.json";

const tables: TableConfig[] = [
  embeddedAccountingNoteTable,
  embeddedActivitySequenceTable,
  agentActorTable,
  embeddedAddressTable,
  embeddedAdjustmentsTable,
  commonAnswerTable,
  billingSettlementBillingDetailsTable,
  serviceBookingTable,
  distributionBookingOptionTable,
  distributionBookingOptionRequestTable,
  embeddedBookingPreferencesTable,
  distributionBookingRequestTable,
  distributionBookingShipmentTable,
  embeddedBookingTimesTable,
  coreCO2EmissionsTable,
  agentCarrierTable,
  embeddedCarrierProductTable,
  embeddedCharacteristicTable,
  actionCheckTable,
  commonCheckTemplateTable,
  commonCheckTotalResultTable,
  embeddedCodeListElementTable,
  agentCompanyTable,
  actionComposingTable,
  embeddedContactDetailTable,
  embeddedCurrencyValueTable,
  coreCustomsInformationTable,
  dGDgDeclarationTable,
  dGDgProductRadioactiveTable,
  dGDgRadioactiveIsotopeTable,
  embeddedDimensionsTable,
  liveAnimalsEpermitConsignmentTable,
  liveAnimalsEpermitSignatureTable,
  commonExternalReferenceTable,
  embeddedGeolocationTable,
  coreInsuranceTable,
  commonIotDeviceTable,
  coreItemTable,
  dGItemDgTable,
  liveAnimalsLiveAnimalsEpermitTable,
  actionLoadingTable,
  commonLoadingMaterialTable,
  commonLoadingUnitTable,
  commonLocationTable,
  abstractLogisticsActionTable,
  abstractLogisticsActivityTable,
  abstractLogisticsAgentTable,
  eventLogisticsEventTable,
  abstractLogisticsObjectTable,
  abstractLogisticsServiceTable,
  embeddedLoosePieceTable,
  embeddedMeasurementTable,
  embeddedMovementTimeTable,
  agentNonHumanActorTable,
  agentOrganizationTable,
  embeddedOtherChargeTable,
  embeddedOtherIdentifierTable,
  corePackagingTypeTable,
  embeddedPartyTable,
  agentPersonTable,
  abstractPhysicalLogisticsObjectTable,
  corePieceTable,
  dGPieceDgTable,
  embeddedPieceGroupTable,
  liveAnimalsPieceLiveAnimalsTable,
  distributionPriceTable,
  coreProductTable,
  dGProductDgTable,
  agentPublicAuthorityTable,
  commonQuestionTable,
  embeddedRangesTable,
  distributionRatingsTable,
  embeddedRegulatedEntityTable,
  coreSecurityDeclarationTable,
  commonSensorTable,
  coreShipmentTable,
  embeddedStationRemarksTable,
  activityStorageTable,
  actionStoringTable,
  embeddedTemperatureInstructionsTable,
  distributionTransportLegsTable,
  coreTransportMeansTable,
  activityTransportMovementTable,
  coreULDTable,
  embeddedULDBasicPieceTable,
  embeddedULDSpecificPieceTable,
  activityUnitCompositionTable,
  embeddedUnitsPreferenceTable,
  embeddedValueTable,
  embeddedVolumePieceGroupTable,
  embeddedVolumetricWeightTable,
  coreWaybillTable,
  embeddedWaybillLineItemTable
];

export default tables;
