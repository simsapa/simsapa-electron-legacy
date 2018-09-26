module View exposing (view)

import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Material.Icon as Icon
import Material.LayoutGrid as Grid
import Material.Options as Options exposing (cs, css, onClick, onInput, styled, when)
import Model exposing (Model)
import Msg exposing (Msg(..))
import Route exposing (Route(..))
import Types exposing (..)
import Url
import View.ReadText
import View.SearchDictionary
import View.SearchTexts


view : Model -> Browser.Document Msg
view model =
    { title = "Siṃsapā Dhamma Reader"
    , body =
        [ Grid.view
            []
            [ Grid.cell
                [ Grid.span2 ]
                [ drawerHeader model
                , viewSelecteTextsList model
                ]
            , Grid.cell
                [ Grid.span10 ]
                [ viewBody model ]
            ]
        ]
    }


type alias MenuItem =
    { text : String
    , iconName : String
    , route : Maybe Route
    , focus : Maybe String
    }


menuItems : List MenuItem
menuItems =
    [ { text = "Texts", iconName = "library_books", route = Just SearchTexts, focus = Just "query-input" }
    , { text = "Dictionary", iconName = "featured_play_list", route = Just SearchDictionary, focus = Just "query-input" }
    ]


viewDrawerMenuItem : Model -> MenuItem -> Html Msg
viewDrawerMenuItem model menuItem =
    let
        isCurrentLocation =
            case model.history of
                currentLocation :: _ ->
                    currentLocation == menuItem.route

                _ ->
                    False

        focusCmd =
            case menuItem.focus of
                Just id ->
                    FocusInput id

                Nothing ->
                    NoOp

        onClickCmd =
            case ( isCurrentLocation, menuItem.route ) of
                ( False, Just route ) ->
                    onClick (NewUrl route menuItem.focus)

                _ ->
                    Options.nop
    in
    styled Html.div
        [ onClickCmd
        , when isCurrentLocation (css "background-color" "#eee")
        , css "color" "#333"
        , css "font-weight" "500"
        ]
        [ Icon.view
            [ css "color" "#333"
            , css "margin-right" "32px"
            ]
            menuItem.iconName
        , text menuItem.text
        ]


viewSelecteTextsList : Model -> Html Msg
viewSelecteTextsList model =
    styled Html.div
        [ css "background-color" "#ccc"
        , css "color" "#333"
        , css "flex-grow" "1"
        ]
        [ Html.div [] <|
            List.map (viewDrawerMenuItem model) menuItems
        , styled Html.div [ css "border-top" "1px #ccc solid" ] []
        , Html.div [] <|
            List.map (\x -> viewSelectedTextRow x model) model.textSearchState.selectedTextList
        ]


getUid t =
    case t of
        SelectedRootText t_ ->
            t_.uid

        SelectedTranslatedText t_ ->
            t_.uid


viewSelectedTextRow : SelectedText -> Model -> Html Msg
viewSelectedTextRow t model =
    let
        isCurrentReading =
            case model.textReadState.selectedText of
                Just sel_t ->
                    case model.history of
                        currentLocation :: _ ->
                            if currentLocation == Just Route.ReadText then
                                getUid t == getUid sel_t

                            else
                                False

                        _ ->
                            False

                Nothing ->
                    False

        content =
            case t of
                SelectedRootText t_ ->
                    styled Html.div
                        []
                        [ styled Html.div [ css "font-weight" "bold" ] [ text t_.acronym ]
                        , styled Html.div [] [ text t_.title ]
                        ]

                SelectedTranslatedText t_ ->
                    styled Html.div
                        []
                        [ styled Html.div [ css "font-weight" "bold" ] [ text t_.acronym ]
                        , styled Html.div [] [ text t_.translated_title ]
                        ]
    in
    styled Html.div
        [ cs "hover-gray"
        , css "padding" "1em"
        , when isCurrentReading (css "background-color" "#0000ff")
        , onClick (SetSelectedReadText t)
        ]
        [ content ]


drawerHeader : Model -> Html Msg
drawerHeader model =
    styled Html.header
        [ css "display" "flex"
        , css "box-sizing" "border-box"
        , css "justify-content" "flex-end"
        , css "padding" "16px"
        , css "flex-direction" "column"
        , cs "demo-header"
        , css "background-color" "#ccc"
        , css "color" "#333"
        ]
        [ styled Html.img
            [ Options.attribute <| src "/assets/images/simsapa-logo-outline.svg"
            , css "display" "block"
            , css "width" "166px"
            , css "height" "180px"
            , css "margin" "auto"
            ]
            []
        ]


viewBody : Model -> Html Msg
viewBody model =
    case model.history |> List.head |> Maybe.withDefault Nothing of
        Just Route.Home ->
            View.SearchTexts.view model

        Just Route.ReadText ->
            View.ReadText.view model

        Just Route.SearchTexts ->
            View.SearchTexts.view model

        Just Route.SearchDictionary ->
            View.SearchDictionary.view model

        Nothing ->
            text "404"
