RegisterNUICallback("CloseAlerts", function(data, cb)
	cb("OK")
	EmergencyAlerts:Close()
end)

RegisterNUICallback("RouteAlert", function(data, cb)
	cb("OK")
	if data.location then
		UISounds.Play:FrontEnd(-1, "SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET")
		EmergencyAlerts:Close()

		if data.blip then
			local f = false
			for k, v in ipairs(_alertBlips) do
				if v.id == data.blip.id then
					v.time = GlobalState["OS:Time"] + data.blip.duration
					f = true
					break
				end
			end

			if not f then
				local eB = Blips:Add(
					data.blip.id,
					data.title,
					data.location,
					data.blip.icon,
					data.blip.color,
					data.blip.size,
					2
				)
				table.insert(_alertBlips, {
					id = data.blip.id,
					time = GlobalState["OS:Time"] + data.blip.duration,
					blip = eB,
				})
				SetBlipFlashes(eB, data.isPanic)
			end
		end

		ClearGpsPlayerWaypoint()
		SetNewWaypoint(data.location.x, data.location.y)
		Notification:Info("Alert Location Marked")

		-- Note: RouteAlert only sets the player's GPS now. Assigning to calls is a separate action
		-- Use the 'RouteAndAssign' NUI callback if you want to route and assign in one action.
	end
end)

RegisterNUICallback("RouteAndAssign", function(data, cb)
	cb('OK')
	if data.location then
		-- perform routing same as RouteAlert
		UISounds.Play:FrontEnd(-1, "SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET")
		EmergencyAlerts:Close()

		if data.blip then
			local f = false
			for k, v in ipairs(_alertBlips) do
				if v.id == data.blip.id then
					v.time = GlobalState["OS:Time"] + data.blip.duration
					f = true
					break
				end
			end

			if not f then
				local eB = Blips:Add(
					data.blip.id,
					data.title,
					data.location,
					data.blip.icon,
					data.blip.color,
					data.blip.size,
					2
				)
				table.insert(_alertBlips, {
					id = data.blip.id,
					time = GlobalState["OS:Time"] + data.blip.duration,
					blip = eB,
				})
				SetBlipFlashes(eB, data.isPanic)
			end
		end

		ClearGpsPlayerWaypoint()
		SetNewWaypoint(data.location.x, data.location.y)
		Notification:Info("Alert Location Marked")

		-- Auto-assign behavior: if the user is attached to another alert, remove them, then assign to this alert
		local myCallsign = nil
		if LocalPlayer and LocalPlayer.state then
			if LocalPlayer.state.Callsign then
				myCallsign = LocalPlayer.state.Callsign
			elseif LocalPlayer.state.callsign then
				myCallsign = LocalPlayer.state.callsign
			end
		end
		if myCallsign then
			-- Tell server to remove from any alerts that contain this callsign, then assign to new
			TriggerServerEvent("EmergencyAlerts:Server:RemoveFromAllAlertsForCallsign", myCallsign)
			if data.blip and data.blip.id then
				TriggerServerEvent("EmergencyAlerts:Server:AssignToAlert", { alertId = data.blip.id, callsign = myCallsign })
			else
				TriggerServerEvent("EmergencyAlerts:Server:AssignToAlert", { alertId = data.id or data.alertId, callsign = myCallsign })
			end
		end
	end
end)

RegisterNUICallback("AssignToAlert", function(data, cb)
    cb('OK')
    if data and data.alertId and data.callsign then
        TriggerServerEvent("EmergencyAlerts:Server:AssignToAlert", { alertId = data.alertId, callsign = data.callsign })
    end
end)

RegisterNUICallback("RemoveFromAlert", function(data, cb)
    cb('OK')
    if data and data.alertId and data.callsign then
        TriggerServerEvent("EmergencyAlerts:Server:RemoveFromAlert", { alertId = data.alertId, callsign = data.callsign })
    end
end)

RegisterNUICallback("ViewCamera", function(data, cb)
	cb('OK')
	if data.camera then
		UISounds.Play:FrontEnd(-1, "SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET")
		EmergencyAlerts:Close()
		Callbacks:ServerCallback("CCTV:ViewGroup", data.camera)
	end
end)

RegisterNUICallback("ChangeUnit", function(data, cb)
	cb("OK")
	UISounds.Play:FrontEnd(-1, "SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET")
	TriggerServerEvent("EmergencyAlerts:Server:ChangeUnit", data)
end)

RegisterNUICallback("OperateUnder", function(data, cb)
	cb("OK")
	UISounds.Play:FrontEnd(-1, "SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET")
	TriggerServerEvent("EmergencyAlerts:Server:OperateUnder", data)
end)

RegisterNUICallback("BreakOff", function(data, cb)
	cb("OK")
	UISounds.Play:FrontEnd(-1, "SELECT", "HUD_FRONTEND_DEFAULT_SOUNDSET")
	TriggerServerEvent("EmergencyAlerts:Server:BreakOff", data)
end)

RegisterNUICallback("SetChannel", function(data, cb)
	cb('OK')
	-- forward radio channel set request to VOIP radio server
	if data and data.frequency then
		TriggerServerEvent('VOIP:Radio:Server:SetChannel', math.floor(tonumber(data.frequency) or 0))
	end
end)
